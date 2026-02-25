import { getStorageBucket } from "./firebase";
import crypto from "crypto";

const MEDIA_PREFIX = "media";
const THUMB_PREFIX = "thumbs";

export async function uploadFile(
  folderId: number,
  filename: string,
  buffer: Buffer,
  contentType: string
): Promise<{ storagePath: string; checksum: string }> {
  const bucket = getStorageBucket();
  const storagePath = `${MEDIA_PREFIX}/${folderId}/${filename}`;
  const file = bucket.file(storagePath);

  // Compute SHA-256 checksum
  const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

  await file.save(buffer, {
    metadata: { contentType },
    resumable: false,
  });

  return { storagePath, checksum };
}

export async function uploadThumbnail(
  folderId: number,
  filename: string,
  buffer: Buffer
): Promise<string> {
  const bucket = getStorageBucket();
  const thumbPath = `${THUMB_PREFIX}/${folderId}/${filename}.webp`;
  const file = bucket.file(thumbPath);

  await file.save(buffer, {
    metadata: { contentType: "image/webp" },
    resumable: false,
  });

  return thumbPath;
}

export async function getDownloadUrl(storagePath: string): Promise<string> {
  const bucket = getStorageBucket();
  const file = bucket.file(storagePath);

  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  });

  return url;
}

export async function getPublicUrl(storagePath: string): Promise<string> {
  const bucket = getStorageBucket();
  const file = bucket.file(storagePath);

  await file.makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
}

export async function deleteFile(storagePath: string): Promise<void> {
  const bucket = getStorageBucket();
  const file = bucket.file(storagePath);

  try {
    await file.delete();
  } catch {
    // File may not exist, ignore
  }
}

export async function deleteThumbnail(
  storagePath: string | null
): Promise<void> {
  if (!storagePath) return;

  const bucket = getStorageBucket();
  const file = bucket.file(storagePath);

  try {
    await file.delete();
  } catch {
    // Thumbnail may not exist, ignore
  }
}

export async function deleteFolder(folderId: number): Promise<void> {
  const bucket = getStorageBucket();

  // Delete all media files
  await bucket.deleteFiles({ prefix: `${MEDIA_PREFIX}/${folderId}/` });

  // Delete all thumbnails
  await bucket.deleteFiles({ prefix: `${THUMB_PREFIX}/${folderId}/` });
}
