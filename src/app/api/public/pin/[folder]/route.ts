import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { folders } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

// GET /api/public/pin/[folder] — get folder exit PIN for Android TV
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

    const folderRecord = await db.query.folders.findFirst({
      where: eq(folders.id, folderId),
    });

    if (!folderRecord) {
      return NextResponse.json({ error: "Folder not found." }, { status: 404 });
    }

    // Return the plain PIN for the Android TV app to use for exit verification
    const response = NextResponse.json({
      pin: folderRecord.pinPlain,
    });

    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Cache-Control", "no-cache");
    return response;
  } catch {
    return NextResponse.json(
      { error: "Couldn't get PIN." },
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
