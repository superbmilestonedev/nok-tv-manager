"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";

interface DeleteFolderDialogProps {
  folder: { id: number; name: string; emoji: string; fileCount: number };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function DeleteFolderDialog({
  folder,
  open,
  onOpenChange,
  onDeleted,
}: DeleteFolderDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/folders/${folder.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Couldn't delete folder.");
        return;
      }

      onDeleted();
    } catch {
      setError("Can't connect right now. Check your internet and try again.");
    } finally {
      setLoading(false);
    }
  }, [folder.id, onDeleted]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Delete Folder
          </DialogTitle>
          <DialogDescription>
            This will permanently delete <strong>{folder.emoji} {folder.name}</strong>
            {folder.fileCount > 0 && (
              <>
                {" "}
                and all <strong>{folder.fileCount} file
                {folder.fileCount !== 1 ? "s" : ""}</strong> inside it
              </>
            )}
            . This can't be undone.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Folder"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
