import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { folders } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth";
import { createSignedUploadUrl } from "@/lib/storage";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-matroska",
  "video/x-msvideo",
  "video/mp4v-es",
];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// POST /api/folders/[id]/media/upload-url
// Returns a signed URL for direct upload to Firebase Storage
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

    const folder = await db.query.folders.findFirst({
      where: eq(folders.id, folderId),
    });
    if (!folder) {
      return NextResponse.json(
        { error: "Folder not found." },
        { status: 404 }
      );
    }

    const { filename, contentType, size } = await request.json();

    // Validate type
    const isImage = ALLOWED_IMAGE_TYPES.includes(contentType);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(contentType);
    if (!isImage && !isVideo) {
      return NextResponse.json(
        {
          error:
            "This file type isn't supported. You can upload images (JPG, PNG, GIF, WebP) and videos (MP4, MOV, MKV).",
        },
        { status: 400 }
      );
    }

    // Validate size
    if (size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error:
            "This file is over 100 MB. Try compressing the video first.",
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = filename.split(".").pop()?.toLowerCase() || "bin";
    const uniqueId = crypto.randomBytes(8).toString("hex");
    const generatedFilename = `${uniqueId}.${ext}`;

    // Create signed upload URL
    const { signedUrl, storagePath } = await createSignedUploadUrl(
      folderId,
      generatedFilename,
      contentType
    );

    return NextResponse.json({
      uploadUrl: signedUrl,
      storagePath,
      generatedFilename,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Not authenticated") {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    console.error("upload-url error:", e);
    return NextResponse.json(
      { error: "Could not prepare upload. Try again." },
      { status: 500 }
    );
  }
}
