"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { brand } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { FolderCard } from "@/components/folder-card";
import { CreateFolderDialog } from "@/components/create-folder-dialog";
import { EditFolderDialog } from "@/components/edit-folder-dialog";
import { DeleteFolderDialog } from "@/components/delete-folder-dialog";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { FolderWithCount } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [folders, setFolders] = useState<FolderWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editFolder, setEditFolder] = useState<FolderWithCount | null>(null);
  const [deleteFolder, setDeleteFolder] = useState<FolderWithCount | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch("/api/folders");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFolders(data);
    } catch {
      toast.error("Couldn't load folders. Check your internet and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.user?.isAdmin) setIsAdmin(true);
      });
  }, [fetchFolders]);

  const handleCreated = useCallback(() => {
    setCreateOpen(false);
    fetchFolders();
    toast.success("Folder created.");
  }, [fetchFolders]);

  const handleUpdated = useCallback(() => {
    setEditFolder(null);
    fetchFolders();
    toast.success("Folder updated.");
  }, [fetchFolders]);

  const handleDeleted = useCallback(() => {
    setDeleteFolder(null);
    fetchFolders();
    toast.success("Folder deleted.");
  }, [fetchFolders]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{brand.name} {brand.tagline}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {folders.length} folder{folders.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => {
              setLoading(true);
              fetchFolders();
            }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          {isAdmin && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Folder
            </Button>
          )}
        </div>
      </div>

      {/* Folder grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl bg-card animate-pulse border border-border/50"
            />
          ))}
        </div>
      ) : folders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">{brand.defaultEmoji}</div>
          <h2 className="text-lg font-semibold mb-2">No folders yet</h2>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Create your first folder to start organizing media for your displays.
          </p>
          {isAdmin && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Folder
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {folders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              isAdmin={isAdmin}
              onClick={() => router.push(`/folders/${folder.id}`)}
              onEdit={() => setEditFolder(folder)}
              onDelete={() => setDeleteFolder(folder)}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateFolderDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />

      {editFolder && (
        <EditFolderDialog
          folder={editFolder}
          open={!!editFolder}
          onOpenChange={(open) => !open && setEditFolder(null)}
          onUpdated={handleUpdated}
        />
      )}

      {deleteFolder && (
        <DeleteFolderDialog
          folder={deleteFolder}
          open={!!deleteFolder}
          onOpenChange={(open) => !open && setDeleteFolder(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
