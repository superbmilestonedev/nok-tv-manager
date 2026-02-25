import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { media, folders } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { reorderSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

// PUT /api/folders/[id]/reorder — reorder media within a folder
export async function PUT(
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
    const parsed = reorderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid reorder data." }, { status: 400 });
    }

    for (const item of parsed.data.items) {
      await db
        .update(media)
        .set({ sortOrder: item.sortOrder })
        .where(eq(media.id, item.id));
    }

    // Increment folder version
    await db
      .update(folders)
      .set({
        version: sql`${folders.version} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(folders.id, folderId));

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json({ error: "Couldn't reorder media." }, { status: 500 });
  }
}
