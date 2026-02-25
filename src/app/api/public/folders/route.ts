import { NextResponse } from "next/server";
import { eq, asc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { folders, media } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

// GET /api/public/folders — public folder list for Android TV
export async function GET() {
  try {
    const result = await db
      .select({
        id: folders.id,
        name: folders.name,
        emoji: folders.emoji,
        sortOrder: folders.sortOrder,
        version: folders.version,
        fileCount: sql<number>`count(${media.id})`.as("file_count"),
      })
      .from(folders)
      .leftJoin(media, eq(media.folderId, folders.id))
      .where(eq(folders.isExcluded, false))
      .groupBy(folders.id)
      .orderBy(asc(folders.sortOrder), asc(folders.id));

    const response = NextResponse.json(result);
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Cache-Control", "public, max-age=30");
    return response;
  } catch {
    return NextResponse.json(
      { error: "Couldn't load folders." },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
    },
  });
}
