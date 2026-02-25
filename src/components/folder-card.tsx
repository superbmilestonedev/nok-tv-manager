"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Pencil, Trash2, EyeOff } from "lucide-react";
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
        "group relative aspect-square rounded-xl border border-border/50 bg-card cursor-pointer transition-all duration-200",
        "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
        folder.isExcluded && "opacity-60"
      )}
      onClick={onClick}
    >
      {/* Content */}
      <div className="flex flex-col items-center justify-center h-full p-3 gap-2">
        <span className="text-4xl">{folder.emoji}</span>
        <span className="text-sm font-medium text-center line-clamp-2 leading-tight">
          {folder.name}
        </span>
        <span className="text-xs text-muted-foreground">
          {folder.fileCount} file{folder.fileCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Badges */}
      {folder.isExcluded && (
        <Badge
          variant="secondary"
          className="absolute top-2 left-2 text-[10px] py-0 px-1.5 gap-1"
        >
          <EyeOff className="w-3 h-3" />
          Hidden
        </Badge>
      )}

      {/* Context menu */}
      {isAdmin && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
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
