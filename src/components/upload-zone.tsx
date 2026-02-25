"use client";

import { useState, useRef, useCallback, type DragEvent } from "react";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";
import { useUpload } from "./upload-provider";

interface UploadZoneProps {
  folderId: number;
  folderName: string;
  folderEmoji: string;
  onUploadComplete: () => void;
}

export function UploadZone({
  folderId,
  folderName,
  folderEmoji,
  onUploadComplete,
}: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addFiles } = useUpload();

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(folderId, folderName, folderEmoji, e.dataTransfer.files, onUploadComplete);
      }
    },
    [folderId, folderName, folderEmoji, addFiles, onUploadComplete]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 overflow-hidden",
        dragOver
          ? "border-primary bg-primary/10 scale-[1.01]"
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/[0.03]"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            addFiles(folderId, folderName, folderEmoji, e.target.files, onUploadComplete);
            e.target.value = "";
          }
        }}
      />

      <div className="flex flex-col items-center gap-4">
        {/* Icon */}
        <div
          className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
            dragOver
              ? "bg-primary/20 text-primary scale-110"
              : "bg-primary/15 text-primary"
          )}
        >
          <Upload className="w-7 h-7" />
        </div>

        {/* Text */}
        <div>
          <p className="text-base font-semibold">
            {dragOver ? "Drop files here" : "Drop files here, or click to upload"}
          </p>
          <p className="text-sm text-muted-foreground mt-1.5">
            Images (JPG, PNG, GIF, WebP) and videos (MP4, MOV, MKV)
          </p>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground/70">
          <span>1920 x 1080 (landscape) or 1080 x 1920 (portrait)</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          <span>100 MB max per file</span>
        </div>
      </div>
    </div>
  );
}
