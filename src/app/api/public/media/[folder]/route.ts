import { NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { media, folders } from "@/lib/db/schema";
import { getDownloadUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

// GET /api/public/media/[folder] — public media list for Android TV
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ folder: string }> }
) {
  try {
    const { folder } = await params;
    const folderId = parseInt(folder, 10);
    if (isNaN(folderId)) {
      return NextResponse.json({ error: "Invalid folder ID." }, { status: 400 });
    }

    // Check folder exists and is not excluded
    const folderRecord = await db.query.folders.findFirst({
      where: eq(folders.id, folderId),
    });
    if (!folderRecord || folderRecord.isExcluded) {
      return NextResponse.json({ error: "Folder not found." }, { status: 404 });
    }

    const items = await db
      .select()
      .from(media)
      .where(eq(media.folderId, folderId))
      .orderBy(asc(media.sortOrder), asc(media.id));

    // Generate download URLs
    const itemsWithUrls = await Promise.all(
      items.map(async (item) => {
        let downloadUrl: string | null = null;
        try {
          downloadUrl = await getDownloadUrl(item.storagePath);
        } catch {
          // Skip if URL generation fails
        }

        return {
          id: item.id,
          filename: item.filename,
          originalName: item.originalName,
          type: item.type,
          size: item.size,
          checksum: item.checksum,
          sortOrder: item.sortOrder,
          width: item.width,
          height: item.height,
          downloadUrl,
        };
      })
    );

    const response = NextResponse.json({
      folder: {
        id: folderRecord.id,
        name: folderRecord.name,
        emoji: folderRecord.emoji,
        version: folderRecord.version,
      },
      media: itemsWithUrls,
    });

    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Cache-Control", "public, max-age=30");
    return response;
  } catch {
    return NextResponse.json(
      { error: "Couldn't load media." },
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
