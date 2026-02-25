import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { folders, media } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { verifyFileExists, downloadFileBuffer, uploadThumbnail } from "@/lib/storage";
import sharp from "sharp";

export const dynamic = "force-dynamic";

// POST /api/folders/[id]/media/confirm
// Called after a file is uploaded directly to Firebase Storage.
// Creates the DB record and increments the folder version.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;
    const folderId = parseInt(id, 10);
    if (isNaN(folderId)) {
      return NextResponse.json(
        { error: "Invalid folder ID." },
        { status: 400 }
      );
    }

    const { storagePath, originalName, type, size, checksum, filename } =
      await request.json();

    if (!storagePath || !originalName || !type || !filename) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    // Verify file exists in Firebase Storage
    const exists = await verifyFileExists(storagePath);
    if (!exists) {
      return NextResponse.json(
        { error: "File not found in storage. Upload may have failed." },
        { status: 400 }
      );
    }

    // Get next sort order
    const maxOrder = await db
      .select({ max: sql<number>`max(${media.sortOrder})` })
      .from(media)
      .where(eq(media.folderId, folderId));
    const nextOrder = (maxOrder[0]?.max ?? -1) + 1;

    // Insert record
    const [inserted] = await db
      .insert(media)
      .values({
        folderId,
        filename,
        originalName,
        type,
        size,
        storagePath,
        thumbnailPath: null,
        checksum: checksum || null,
        sortOrder: nextOrder,
      })
      .returning();

    // Generate thumbnail for images
    if (type === "image") {
      try {
        const originalBuffer = await downloadFileBuffer(storagePath);
        const thumbnailBuffer = await sharp(originalBuffer)
          .resize(400, 400, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();

        const thumbPath = await uploadThumbnail(folderId, filename, thumbnailBuffer);

        // Update the DB record with thumbnail path
        await db
          .update(media)
          .set({ thumbnailPath: thumbPath })
          .where(eq(media.id, inserted.id));

        inserted.thumbnailPath = thumbPath;
      } catch (thumbErr) {
        console.error("Thumbnail generation failed:", thumbErr);
        // Continue without thumbnail — the full image URL will be used as fallback
      }
    }

    // Increment folder version
    await db
      .update(folders)
      .set({
        version: sql`${folders.version} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(folders.id, folderId));

    return NextResponse.json(inserted);
  } catch (e) {
    if (e instanceof Error && e.message === "Not authenticated") {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    console.error("confirm error:", e);
    return NextResponse.json(
      { error: "Could not save file record. Try again." },
      { status: 500 }
    );
  }
}
