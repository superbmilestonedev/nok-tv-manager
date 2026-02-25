"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import {
  X,
  RotateCcw,
  Check,
  FileVideo,
  FileImage,
  ChevronDown,
  ChevronUp,
  Folder,
} from "lucide-react";

type FileStatus =
  | "queued"
  | "hashing"
  | "preparing"
  | "uploading"
  | "confirming"
  | "done"
  | "failed";

interface QueueItem {
  id: string;
  file: File;
  folderId: number;
  folderName: string;
  folderEmoji: string;
  status: FileStatus;
  progress: number;
  error?: string;
  checksum?: string;
}

interface UploadContextValue {
  addFiles: (
    folderId: number,
    folderName: string,
    folderEmoji: string,
    files: FileList | File[],
    onComplete?: () => void
  ) => void;
  hasActiveUploads: boolean;
}

const UploadContext = createContext<UploadContextValue | null>(null);

export function useUpload() {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error("useUpload must be used within UploadProvider");
  return ctx;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function sha256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function UploadProvider({ children }: { children: ReactNode }) {
  const [minimized, setMinimized] = useState(false);
  const [, forceRender] = useState(0);
  const queueRef = useRef<QueueItem[]>([]);
  const processingRef = useRef(false);
  const xhrMapRef = useRef<Map<string, XMLHttpRequest>>(new Map());
  const completionCallbacksRef = useRef<Map<number, () => void>>(new Map());

  const render = useCallback(() => forceRender((n) => n + 1), []);
  const queue = queueRef.current;

  function updateItem(id: string, updates: Partial<QueueItem>) {
    const idx = queueRef.current.findIndex((f) => f.id === id);
    if (idx === -1) return;
    queueRef.current = [
      ...queueRef.current.slice(0, idx),
      { ...queueRef.current[idx], ...updates },
      ...queueRef.current.slice(idx + 1),
    ];
    render();
  }

  function removeItem(id: string) {
    const xhr = xhrMapRef.current.get(id);
    if (xhr) {
      xhr.abort();
      xhrMapRef.current.delete(id);
    }
    queueRef.current = queueRef.current.filter((f) => f.id !== id);
    render();
  }

  async function processFile(item: QueueItem) {
    const { id, file, folderId } = item;

    try {
      // Step 1: Compute checksum
      updateItem(id, { status: "hashing" });
      const checksum = await sha256(file);
      updateItem(id, { checksum });

      if (!queueRef.current.find((f) => f.id === id)) return;

      // Step 2: Get signed upload URL from server
      updateItem(id, { status: "preparing" });
      const urlRes = await fetch(`/api/folders/${folderId}/media/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          size: file.size,
        }),
      });

      if (!urlRes.ok) {
        const err = await urlRes.json().catch(() => ({}));
        throw new Error(err.error || "Could not prepare upload");
      }

      const { uploadUrl, storagePath, generatedFilename } = await urlRes.json();

      if (!queueRef.current.find((f) => f.id === id)) return;

      // Step 3: Upload directly to Firebase Storage
      updateItem(id, { status: "uploading", progress: 0 });

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrMapRef.current.set(id, xhr);

        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader(
          "Content-Type",
          file.type || "application/octet-stream"
        );

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            updateItem(id, {
              progress: Math.round((e.loaded / e.total) * 100),
            });
          }
        };

        xhr.onload = () => {
          xhrMapRef.current.delete(id);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed (${xhr.status})`));
          }
        };

        xhr.onerror = () => {
          xhrMapRef.current.delete(id);
          reject(new Error("Connection lost. Check your internet."));
        };

        xhr.onabort = () => {
          xhrMapRef.current.delete(id);
          reject(new Error("__cancelled__"));
        };

        xhr.send(file);
      });

      if (!queueRef.current.find((f) => f.id === id)) return;

      // Step 4: Confirm upload with server
      updateItem(id, { status: "confirming" });
      const confirmRes = await fetch(
        `/api/folders/${folderId}/media/confirm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storagePath,
            originalName: file.name,
            type: file.type.startsWith("image/") ? "image" : "video",
            size: file.size,
            checksum,
            filename: generatedFilename,
          }),
        }
      );

      if (!confirmRes.ok) {
        throw new Error("Could not save file. Try again.");
      }

      updateItem(id, { status: "done", progress: 100 });

      // Call completion callback for this folder
      const cb = completionCallbacksRef.current.get(folderId);
      if (cb) cb();
    } catch (err) {
      if (err instanceof Error && err.message === "__cancelled__") return;
      updateItem(id, {
        status: "failed",
        error: err instanceof Error ? err.message : "Upload failed",
      });
    }
  }

  async function processQueue() {
    if (processingRef.current) return;
    processingRef.current = true;

    while (true) {
      const next = queueRef.current.find((f) => f.status === "queued");
      if (!next) break;
      await processFile(next);
    }

    processingRef.current = false;
  }

  function retryFile(id: string) {
    updateItem(id, { status: "queued", progress: 0, error: undefined });
    processQueue();
  }

  function cancelAll() {
    for (const [, xhr] of xhrMapRef.current) {
      xhr.abort();
    }
    xhrMapRef.current.clear();
    queueRef.current = [];
    render();
  }

  function addFiles(
    folderId: number,
    folderName: string,
    folderEmoji: string,
    newFiles: FileList | File[],
    onComplete?: () => void
  ) {
    if (onComplete) {
      completionCallbacksRef.current.set(folderId, onComplete);
    }

    const items: QueueItem[] = Array.from(newFiles).map((file) => ({
      id: crypto.randomUUID(),
      file,
      folderId,
      folderName,
      folderEmoji,
      status: "queued" as const,
      progress: 0,
    }));
    queueRef.current = [...queueRef.current, ...items];
    render();
    processQueue();
  }

  const doneCount = queue.filter((f) => f.status === "done").length;
  const failedCount = queue.filter((f) => f.status === "failed").length;
  const hasActive = queue.some(
    (f) => !["done", "failed"].includes(f.status)
  );

  // Group by folder for the header display
  const folderIds = [...new Set(queue.map((q) => q.folderId))];
  const currentItem = queue.find(
    (f) => !["done", "failed"].includes(f.status)
  );

  const uploadPanel =
    queue.length > 0 && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed bottom-4 right-4 z-50 w-96 rounded-xl border border-border/60 bg-card shadow-2xl shadow-black/20 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
            {/* Panel header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b border-border/50 cursor-pointer select-none hover:bg-muted/30 transition-colors"
              onClick={() => setMinimized((m) => !m)}
            >
              <div className="flex items-center gap-2 min-w-0">
                {hasActive && (
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                )}
                <span className="text-sm font-medium truncate">
                  {hasActive
                    ? `Uploading ${doneCount + 1} of ${queue.length}...`
                    : doneCount === queue.length
                      ? `${doneCount} upload${doneCount !== 1 ? "s" : ""} complete`
                      : `${doneCount} of ${queue.length} uploaded`}
                  {failedCount > 0 && (
                    <span className="text-destructive ml-1">
                      · {failedCount} failed
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!hasActive && queue.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      queueRef.current = [];
                      render();
                    }}
                    className="p-1 hover:bg-muted rounded-md transition-colors"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
                {hasActive && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelAll();
                    }}
                    className="text-xs text-destructive hover:text-destructive/80 px-2 py-1 rounded-md hover:bg-destructive/10 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                {minimized ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* File list — collapsible */}
            {!minimized && (
              <div className="divide-y divide-border/50 max-h-80 overflow-y-auto">
                {/* Folder sections */}
                {folderIds.map((fId) => {
                  const folderItems = queue.filter((q) => q.folderId === fId);
                  const first = folderItems[0];
                  return (
                    <div key={fId}>
                      {/* Folder label */}
                      {folderIds.length > 1 && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-muted/30">
                          <span className="text-sm">{first.folderEmoji}</span>
                          <span className="text-xs font-medium text-muted-foreground truncate">
                            {first.folderName}
                          </span>
                        </div>
                      )}
                      {folderIds.length === 1 && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-muted/30">
                          <span className="text-sm">{first.folderEmoji}</span>
                          <span className="text-xs font-medium text-muted-foreground truncate">
                            {first.folderName}
                          </span>
                        </div>
                      )}
                      {/* Files in folder */}
                      {folderItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 px-4 py-3"
                        >
                          {/* File type icon */}
                          <div
                            className={cn(
                              "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                              item.status === "done"
                                ? "bg-green-500/10"
                                : item.status === "failed"
                                  ? "bg-destructive/10"
                                  : "bg-muted/50"
                            )}
                          >
                            {item.status === "done" ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : item.file.type.startsWith("video/") ? (
                              <FileVideo className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <FileImage className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>

                          {/* File info + progress */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm truncate pr-2">
                                {item.file.name}
                              </p>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {formatSize(item.file.size)}
                              </span>
                            </div>

                            {/* Progress bar */}
                            {[
                              "uploading",
                              "hashing",
                              "preparing",
                              "confirming",
                            ].includes(item.status) && (
                              <div className="mt-1.5">
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={cn(
                                      "h-full rounded-full transition-all duration-300",
                                      item.status === "uploading"
                                        ? "bg-primary"
                                        : "bg-primary/50 animate-pulse"
                                    )}
                                    style={{
                                      width:
                                        item.status === "uploading"
                                          ? `${item.progress}%`
                                          : "100%",
                                    }}
                                  />
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  {item.status === "hashing" &&
                                    "Checking file..."}
                                  {item.status === "preparing" &&
                                    "Preparing upload..."}
                                  {item.status === "uploading" &&
                                    `${item.progress}%`}
                                  {item.status === "confirming" && "Saving..."}
                                </p>
                              </div>
                            )}

                            {/* Error message */}
                            {item.status === "failed" && (
                              <p className="text-[11px] text-destructive mt-0.5">
                                {item.error}
                              </p>
                            )}

                            {/* Queued label */}
                            {item.status === "queued" && (
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                Waiting...
                              </p>
                            )}
                          </div>

                          {/* Action button */}
                          <div className="shrink-0">
                            {item.status === "failed" && (
                              <button
                                onClick={() => retryFile(item.id)}
                                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                                title="Retry"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                              </button>
                            )}

                            {[
                              "queued",
                              "hashing",
                              "preparing",
                              "uploading",
                              "confirming",
                            ].includes(item.status) && (
                              <button
                                onClick={() => removeItem(item.id)}
                                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5 text-muted-foreground" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>,
          document.body
        )
      : null;

  return (
    <UploadContext.Provider value={{ addFiles, hasActiveUploads: hasActive }}>
      {children}
      {uploadPanel}
    </UploadContext.Provider>
  );
}
