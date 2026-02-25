import { NextResponse } from "next/server";
import { eq, asc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { folders, media } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { uploadFile, uploadThumbnail, getDownloadUrl } from "@/lib/storage";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/x-matroska", "video/x-msvideo", "video/mp4v-es"];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

function getMediaType(mimeType: string): "image" | "video" | null {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return "image";
  if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return "video";
  return null;
}

// GET /api/folders/[id]/media — list media in folder
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;
    const folderId = parseInt(id, 10);
    if (isNaN(folderId)) {
      return NextResponse.json({ error: "Invalid folder ID." }, { status: 400 });
    }

    const items = await db
      .select()
      .from(media)
      .where(eq(media.folderId, folderId))
      .orderBy(asc(media.sortOrder), asc(media.id));

    // Generate download URLs for thumbnails and media
    const itemsWithUrls = await Promise.all(
      items.map(async (item) => {
        let thumbnailUrl: string | null = null;
        let downloadUrl: string | null = null;

        try {
          downloadUrl = await getDownloadUrl(item.storagePath);
          if (item.thumbnailPath) {
            thumbnailUrl = await getDownloadUrl(item.thumbnailPath);
          }
        } catch {
          // URL generation failed, continue without
        }

        return {
          ...item,
          downloadUrl,
          thumbnailUrl,
        };
      })
    );

    return NextResponse.json(itemsWithUrls);
  } catch (e) {
    if (e instanceof Error && e.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json({ error: "Couldn't load media." }, { status: 500 });
  }
}

// POST /api/folders/[id]/media — upload file(s)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;
    const folderId = parseInt(id, 10);
    if (isNaN(folderId)) {
      return NextResponse.json({ error: "Invalid folder ID." }, { status: 400 });
    }

    // Check folder exists
    const folder = await db.query.folders.findFirst({
      where: eq(folders.id, folderId),
    });
    if (!folder) {
      return NextResponse.json({ error: "Folder not found." }, { status: 404 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided." }, { status: 400 });
    }

    const results = [];
    const errors = [];

    // Get current max sort order
    const maxOrder = await db
      .select({ max: sql<number>`max(${media.sortOrder})` })
      .from(media)
      .where(eq(media.folderId, folderId));
    let nextOrder = (maxOrder[0]?.max ?? -1) + 1;

    for (const file of files) {
      // Validate type
      const mediaType = getMediaType(file.type);
      if (!mediaType) {
        errors.push({
          name: file.name,
          error: "This file type isn't supported. You can upload images (JPG, PNG, GIF, WebP) and videos (MP4, MOV, MKV).",
        });
        continue;
      }

      // Validate size
      if (file.size > MAX_FILE_SIZE) {
        errors.push({
          name: file.name,
          error: "This file is over 100 MB. Try compressing the video first, or contact your video editor to send a smaller file.",
        });
        continue;
      }

      try {
        const buffer = Buffer.from(await file.arrayBuffer());

        // Generate unique filename
        const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
        const uniqueId = crypto.randomBytes(8).toString("hex");
        const filename = `${uniqueId}.${ext}`;

        // Upload to Firebase Storage
        const { storagePath, checksum } = await uploadFile(
          folderId,
          filename,
          buffer,
          file.type
        );

        // Generate thumbnail for images (basic — skip for video on free tier)
        let thumbnailPath: string | null = null;
        if (mediaType === "image") {
          try {
            // For now, use the original as thumbnail (sharp can be added later)
            // We'll store a small version if we add sharp
            thumbnailPath = null; // TODO: sharp thumbnail generation
          } catch {
            // Thumbnail generation failed, continue without
          }
        }

        // Insert into DB
        const [inserted] = await db
          .insert(media)
          .values({
            folderId,
            filename,
            originalName: file.name,
            type: mediaType,
            size: file.size,
            storagePath,
            thumbnailPath,
            checksum,
            sortOrder: nextOrder++,
          })
          .returning();

        results.push(inserted);
      } catch {
        errors.push({
          name: file.name,
          error: "This upload didn't go through. Check your internet and try again.",
        });
      }
    }

    // Increment folder version
    if (results.length > 0) {
      await db
        .update(folders)
        .set({
          version: sql`${folders.version} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(folders.id, folderId));
    }

    return NextResponse.json({
      uploaded: results,
      errors,
      total: files.length,
      succeeded: results.length,
      failed: errors.length,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
