import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { folders } from "@/lib/db/schema";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { updateFolderSchema } from "@/lib/validations";
import { deleteFolder as deleteStorageFolder } from "@/lib/storage";

export const dynamic = "force-dynamic";

// PATCH /api/folders/[id] — update folder
export async function PATCH(
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

    const body = await request.json();
    const parsed = updateFolderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid update data." }, { status: 400 });
    }

    const existing = await db.query.folders.findFirst({
      where: eq(folders.id, folderId),
    });
    if (!existing) {
      return NextResponse.json({ error: "Folder not found." }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (parsed.data.name !== undefined) {
      // Check duplicate
      const dup = await db.query.folders.findFirst({
        where: eq(folders.name, parsed.data.name),
      });
      if (dup && dup.id !== folderId) {
        return NextResponse.json(
          { error: "A folder with that name already exists." },
          { status: 409 }
        );
      }
      updates.name = parsed.data.name;
    }

    if (parsed.data.emoji !== undefined) {
      updates.emoji = parsed.data.emoji;
    }

    if (parsed.data.pin !== undefined) {
      updates.pinHash = await hash(parsed.data.pin, 10);
      updates.pinPlain = parsed.data.pin;
    }

    if (parsed.data.isExcluded !== undefined) {
      updates.isExcluded = parsed.data.isExcluded;
    }

    const [updated] = await db
      .update(folders)
      .set(updates)
      .where(eq(folders.id, folderId))
      .returning();

    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof Error && e.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json({ error: "Couldn't update folder." }, { status: 500 });
  }
}

// DELETE /api/folders/[id] — delete folder + all contents
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const folderId = parseInt(id, 10);
    if (isNaN(folderId)) {
      return NextResponse.json({ error: "Invalid folder ID." }, { status: 400 });
    }

    const existing = await db.query.folders.findFirst({
      where: eq(folders.id, folderId),
    });
    if (!existing) {
      return NextResponse.json({ error: "Folder not found." }, { status: 404 });
    }

    // Delete from Firebase Storage
    await deleteStorageFolder(folderId);

    // Delete from DB (cascade deletes media rows)
    await db.delete(folders).where(eq(folders.id, folderId));

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Couldn't delete folder." }, { status: 500 });
  }
}
