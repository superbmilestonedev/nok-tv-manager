"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Pencil, Trash2, EyeOff, FileImage, Monitor, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FolderWithCount } from "@/lib/types";

interface FolderCardProps {
  folder: FolderWithCount;
  isAdmin: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function FolderCard({
  folder,
  isAdmin,
  onClick,
  onEdit,
  onDelete,
}: FolderCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-border/50 bg-card cursor-pointer transition-all duration-300 overflow-hidden",
        "hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1",
        folder.isExcluded && "opacity-50"
      )}
      onClick={onClick}
    >
      {/* Content */}
      <div className="flex flex-col items-center justify-center px-4 pt-6 pb-5 gap-3">
        {/* Emoji with subtle glow */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <span className="relative text-5xl drop-shadow-sm">{folder.emoji}</span>
        </div>

        {/* Name */}
        <span className="text-sm font-semibold text-center line-clamp-2 leading-tight tracking-tight">
          {folder.name}
        </span>

        {/* File count + orientation pills */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1 bg-muted/50 rounded-full px-2.5 py-1">
            <FileImage className="w-3 h-3" />
            <span>{folder.fileCount} file{folder.fileCount !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-1 bg-muted/50 rounded-full px-2 py-1">
            {folder.rotation ? (
              <><Smartphone className="w-3 h-3" /><span>Vertical</span></>
            ) : (
              <><Monitor className="w-3 h-3" /><span>Horizontal</span></>
            )}
          </div>
        </div>
      </div>

      {/* Hidden badge */}
      {folder.isExcluded && (
        <div className="absolute top-3 left-2.5 flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/80 backdrop-blur-sm rounded-md px-1.5 py-0.5">
          <EyeOff className="w-3 h-3" />
          Hidden
        </div>
      )}

      {/* Context menu */}
      {isAdmin && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2.5 right-2 w-7 h-7 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
