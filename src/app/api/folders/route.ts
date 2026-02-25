import { NextResponse } from "next/server";
import { eq, asc, sql } from "drizzle-orm";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { folders, media } from "@/lib/db/schema";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { createFolderSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

// GET /api/folders — list all folders with media count
export async function GET() {
  try {
    await requireAuth();

    const result = await db
      .select({
        id: folders.id,
        name: folders.name,
        emoji: folders.emoji,
        sortOrder: folders.sortOrder,
        isExcluded: folders.isExcluded,
        version: folders.version,
        pinPlain: folders.pinPlain,
        createdAt: folders.createdAt,
        updatedAt: folders.updatedAt,
        fileCount: sql<number>`count(${media.id})`.as("file_count"),
      })
      .from(folders)
      .leftJoin(media, eq(media.folderId, folders.id))
      .groupBy(folders.id)
      .orderBy(asc(folders.sortOrder), asc(folders.id));

    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof Error && e.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load folders." }, { status: 500 });
  }
}

// POST /api/folders — create a new folder
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const parsed = createFolderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid folder name. Use letters, numbers, spaces, hyphens, or underscores." },
        { status: 400 }
      );
    }

    const { name } = parsed.data;

    // Check for duplicate name
    const existing = await db.query.folders.findFirst({
      where: eq(folders.name, name),
    });
    if (existing) {
      return NextResponse.json(
        { error: "A folder with that name already exists." },
        { status: 409 }
      );
    }

    // Get next sort order
    const maxOrder = await db
      .select({ max: sql<number>`max(${folders.sortOrder})` })
      .from(folders);
    const nextOrder = (maxOrder[0]?.max ?? -1) + 1;

    // Hash default PIN
    const pinHash = await hash("0000", 10);

    const [folder] = await db
      .insert(folders)
      .values({
        name,
        sortOrder: nextOrder,
        pinHash,
        pinPlain: "0000",
      })
      .returning();

    return NextResponse.json(folder, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Couldn't create folder." }, { status: 500 });
  }
}
