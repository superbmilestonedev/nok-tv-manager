"use client";

import { useState, useRef, useCallback, type DragEvent } from "react";
import { cn } from "@/lib/utils";
import { Upload, Loader2 } from "lucide-react";

interface UploadZoneProps {
  onUpload: (files: FileList | File[]) => void;
  uploading: boolean;
}

export function UploadZone({ onUpload, uploading }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
        onUpload(e.dataTransfer.files);
      }
    },
    [onUpload]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={cn(
        "border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all",
        dragOver
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-muted-foreground/30 hover:border-muted-foreground/60",
        uploading && "opacity-60 cursor-not-allowed"
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
            onUpload(e.target.files);
            e.target.value = "";
          }
        }}
        disabled={uploading}
      />

      {uploading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Uploading...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Upload
            className={cn(
              "w-14 h-14 transition-colors",
              dragOver ? "text-primary" : "text-muted-foreground"
            )}
          />
          <div>
            <p className="text-lg font-medium">
              {dragOver ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse — images (JPG, PNG, GIF, WebP) and videos (MP4, MOV, MKV)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
