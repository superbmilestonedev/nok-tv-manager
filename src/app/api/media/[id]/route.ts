import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { media, folders } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { deleteFile, deleteThumbnail } from "@/lib/storage";

export const dynamic = "force-dynamic";

// DELETE /api/media/[id] — delete a single media file
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;
    const mediaId = parseInt(id, 10);
    if (isNaN(mediaId)) {
      return NextResponse.json({ error: "Invalid media ID." }, { status: 400 });
    }

    const item = await db.query.media.findFirst({
      where: eq(media.id, mediaId),
    });
    if (!item) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    // Delete from Firebase Storage
    await deleteFile(item.storagePath);
    await deleteThumbnail(item.thumbnailPath);

    // Delete from DB
    await db.delete(media).where(eq(media.id, mediaId));

    // Increment folder version
    await db
      .update(folders)
      .set({
        version: sql`${folders.version} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(folders.id, item.folderId));

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json({ error: "Couldn't delete file." }, { status: 500 });
  }
}
