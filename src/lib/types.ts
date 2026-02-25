export interface MediaItem {
  id: number;
  folderId: number;
  filename: string;
  originalName: string;
  type: "image" | "video";
  size: number;
  storagePath: string;
  thumbnailPath: string | null;
  checksum: string | null;
  sortOrder: number;
  width: number | null;
  height: number | null;
  downloadUrl: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
}

export interface FolderWithCount {
  id: number;
  name: string;
  emoji: string;
  sortOrder: number;
  rotation: number;
  isExcluded: boolean;
  version: number;
  pinPlain: string;
  createdAt: Date;
  updatedAt: Date;
  fileCount: number;
}
