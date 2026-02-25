import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { folders } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { reorderSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

// PUT /api/folders/reorder — reorder folders
export async function PUT(request: Request) {
  try {
    await requireAuth();

    const body = await request.json();
    const parsed = reorderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid reorder data." }, { status: 400 });
    }

    for (const item of parsed.data.items) {
      await db
        .update(folders)
        .set({ sortOrder: item.sortOrder })
        .where(eq(folders.id, item.id));
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Not authenticated") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json({ error: "Couldn't reorder folders." }, { status: 500 });
  }
}
