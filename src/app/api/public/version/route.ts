import { NextResponse } from "next/server";
import { brand } from "@/lib/brand";

export const dynamic = "force-dynamic";

// GET /api/public/version — app version info for Android TV OTA
export async function GET() {
  const response = NextResponse.json({
    app: brand.name,
    version: "1.0.0",
    android: {
      versionCode: 1,
      versionName: "1.0.0",
      apkUrl: null, // Set when APK is hosted
      minSdkVersion: 21,
    },
  });

  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Cache-Control", "public, max-age=300");
  return response;
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
