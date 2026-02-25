"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Play, MoreVertical, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/lib/types";

interface MediaGridProps {
  items: MediaItem[];
  onReorder: (items: MediaItem[]) => void;
  onPreview: (index: number) => void;
  onDelete: (id: number) => void;
}

export function MediaGrid({
  items,
  onReorder,
  onPreview,
  onDelete,
}: MediaGridProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      dragNode.current = e.target as HTMLDivElement;
      setDragIndex(index);
      e.dataTransfer.effectAllowed = "move";
      // Make it slightly transparent
      requestAnimationFrame(() => {
        if (dragNode.current) {
          dragNode.current.style.opacity = "0.4";
        }
      });
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (dragIndex === null || dragIndex === index) return;
      setOverIndex(index);
    },
    [dragIndex]
  );

  const handleDragEnd = useCallback(() => {
    if (dragNode.current) {
      dragNode.current.style.opacity = "1";
    }

    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      const reordered = [...items];
      const [removed] = reordered.splice(dragIndex, 1);
      reordered.splice(overIndex, 0, removed);
      onReorder(reordered);
    }

    setDragIndex(null);
    setOverIndex(null);
    dragNode.current = null;
  }, [dragIndex, overIndex, items, onReorder]);

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
      {items.map((item, index) => (
        <div
          key={item.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          className={cn(
            "group relative aspect-square rounded-lg border border-border/50 bg-card overflow-hidden cursor-pointer transition-all",
            "hover:border-primary/50 hover:shadow-md",
            overIndex === index &&
              dragIndex !== null &&
              "ring-2 ring-primary scale-105"
          )}
          onClick={() => onPreview(index)}
        >
          {/* Thumbnail */}
          {item.downloadUrl ? (
            item.type === "image" ? (
              <img
                src={item.thumbnailUrl || item.downloadUrl}
                alt={item.originalName}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-secondary flex items-center justify-center">
                <Play className="w-8 h-8 text-muted-foreground" />
              </div>
            )
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center">
              <span className="text-xs text-muted-foreground">No preview</span>
            </div>
          )}

          {/* Video badge */}
          {item.type === "video" && (
            <Badge
              variant="secondary"
              className="absolute top-1.5 left-1.5 text-[10px] py-0 px-1.5 bg-black/60 text-white border-0"
            >
              <Play className="w-2.5 h-2.5 mr-0.5 fill-current" />
              Video
            </Badge>
          )}

          {/* Order badge */}
          <Badge
            variant="secondary"
            className="absolute bottom-1.5 left-1.5 text-[10px] py-0 px-1.5 bg-black/60 text-white border-0 font-mono"
          >
            {index + 1}
          </Badge>

          {/* Drag handle + menu */}
          <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <div
              className="w-6 h-6 flex items-center justify-center rounded bg-black/60 text-white cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6 bg-black/60 text-white hover:bg-black/80 hover:text-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
}
