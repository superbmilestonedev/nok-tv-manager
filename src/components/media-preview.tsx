"use client";

import { useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Download,
} from "lucide-react";
import type { MediaItem } from "@/lib/types";

interface MediaPreviewProps {
  items: MediaItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onDelete: (id: number) => void;
}

export function MediaPreview({
  items,
  currentIndex,
  onClose,
  onNavigate,
  onDelete,
}: MediaPreviewProps) {
  const current = items[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          if (hasPrev) onNavigate(currentIndex - 1);
          break;
        case "ArrowRight":
          if (hasNext) onNavigate(currentIndex + 1);
          break;
      }
    },
    [onClose, onNavigate, currentIndex, hasPrev, hasNext]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/70 font-mono">
            {currentIndex + 1} of {items.length}
          </span>
          <span className="text-sm text-white/50 truncate max-w-xs">
            {current.originalName}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {current.downloadUrl && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/10"
              asChild
            >
              <a
                href={current.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <Download className="w-5 h-5" />
              </a>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-red-400 hover:bg-white/10"
            onClick={() => onDelete(current.id)}
          >
            <Trash2 className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Content area */}
      <div
        className="flex-1 flex items-center justify-center relative min-h-0 px-16"
        onClick={onClose}
      >
        {/* Prev button */}
        {hasPrev && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 text-white/50 hover:text-white hover:bg-white/10 z-10"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(currentIndex - 1);
            }}
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>
        )}

        {/* Media content */}
        <div
          className="max-w-full max-h-full flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {current.type === "image" && current.downloadUrl ? (
            <img
              src={current.downloadUrl}
              alt={current.originalName}
              className="max-w-full max-h-[calc(100vh-120px)] object-contain rounded-lg"
            />
          ) : current.type === "video" && current.downloadUrl ? (
            <video
              key={current.id}
              src={current.downloadUrl}
              controls
              autoPlay
              className="max-w-full max-h-[calc(100vh-120px)] rounded-lg"
            />
          ) : (
            <div className="text-white/50 text-center">
              <p>No preview available</p>
              <p className="text-sm mt-1">{current.originalName}</p>
            </div>
          )}
        </div>

        {/* Next button */}
        {hasNext && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 text-white/50 hover:text-white hover:bg-white/10 z-10"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(currentIndex + 1);
            }}
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        )}
      </div>
    </div>
  );
}
