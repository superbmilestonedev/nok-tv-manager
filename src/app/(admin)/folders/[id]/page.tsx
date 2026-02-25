"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MediaGrid } from "@/components/media-grid";
import { UploadZone } from "@/components/upload-zone";
import { MediaPreview } from "@/components/media-preview";
import { EditFolderDialog } from "@/components/edit-folder-dialog";
import { ArrowLeft, Upload, RefreshCw, Settings } from "lucide-react";
import { toast } from "sonner";
import type { MediaItem, FolderWithCount } from "@/lib/types";

export default function FolderMediaPage() {
  const params = useParams();
  const router = useRouter();
  const folderId = parseInt(params.id as string, 10);

  const [folder, setFolder] = useState<FolderWithCount | null>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async () => {
    try {
      const [foldersRes, mediaRes] = await Promise.all([
        fetch("/api/folders"),
        fetch(`/api/folders/${folderId}/media`),
      ]);

      if (foldersRes.ok) {
        const allFolders = await foldersRes.json();
        const f = allFolders.find((f: FolderWithCount) => f.id === folderId);
        if (f) setFolder(f);
      }

      if (mediaRes.ok) {
        const data = await mediaRes.json();
        setItems(data);
      }
    } catch {
      toast.error("Couldn't load media. Check your internet and try again.");
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleUpload = useCallback(
    async (files: FileList | File[]) => {
      setUploading(true);
      const formData = new FormData();
      for (const file of Array.from(files)) {
        formData.append("files", file);
      }

      try {
        const res = await fetch(`/api/folders/${folderId}/media`, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (data.succeeded > 0) {
          toast.success(
            `${data.succeeded} file${data.succeeded !== 1 ? "s" : ""} uploaded.`
          );
        }

        if (data.errors?.length > 0) {
          for (const err of data.errors) {
            toast.error(`${err.name}: ${err.error}`);
          }
        }

        await fetchMedia();
      } catch {
        toast.error(
          "Upload failed. Check your internet and try again."
        );
      } finally {
        setUploading(false);
      }
    },
    [folderId, fetchMedia]
  );

  const handleDelete = useCallback(
    async (mediaId: number) => {
      try {
        const res = await fetch(`/api/media/${mediaId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || "Couldn't delete file.");
          return;
        }

        toast.success("File deleted.");
        await fetchMedia();

        // Adjust preview index if needed
        if (previewIndex !== null) {
          if (items.length <= 1) {
            setPreviewIndex(null);
          } else if (previewIndex >= items.length - 1) {
            setPreviewIndex(items.length - 2);
          }
        }
      } catch {
        toast.error("Couldn't delete file. Check your internet.");
      }
    },
    [fetchMedia, previewIndex, items.length]
  );

  const handleReorder = useCallback(
    async (reordered: MediaItem[]) => {
      setItems(reordered);

      const reorderData = reordered.map((item, index) => ({
        id: item.id,
        sortOrder: index,
      }));

      try {
        await fetch(`/api/folders/${folderId}/reorder`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: reorderData }),
        });
      } catch {
        toast.error("Couldn't save new order. Try again.");
        fetchMedia(); // Revert to server order
      }
    },
    [folderId, fetchMedia]
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          {folder && (
            <div>
              <h1 className="text-2xl font-bold">
                {folder.emoji} {folder.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {items.length} file{items.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setEditOpen(true)}
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => {
              setLoading(true);
              fetchMedia();
            }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Hidden file input for button upload */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            handleUpload(e.target.files);
            e.target.value = "";
          }
        }}
      />

      {/* Media grid */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-card animate-pulse border border-border/50"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-8">
          <UploadZone onUpload={handleUpload} uploading={uploading} />
        </div>
      ) : (
        <MediaGrid
          items={items}
          onReorder={handleReorder}
          onPreview={(index) => setPreviewIndex(index)}
          onDelete={handleDelete}
        />
      )}

      {/* Preview modal */}
      {previewIndex !== null && items.length > 0 && (
        <MediaPreview
          items={items}
          currentIndex={previewIndex}
          onClose={() => setPreviewIndex(null)}
          onNavigate={setPreviewIndex}
          onDelete={handleDelete}
        />
      )}

      {/* Edit folder dialog */}
      {folder && (
        <EditFolderDialog
          folder={folder}
          open={editOpen}
          onOpenChange={setEditOpen}
          onUpdated={() => {
            setEditOpen(false);
            fetchMedia();
          }}
        />
      )}
    </div>
  );
}
