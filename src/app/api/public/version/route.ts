import { NextResponse } from "next/server";
import { brand } from "@/lib/brand";

export const dynamic = "force-dynamic";

// GET /api/public/version — app version info for Android TV OTA
export async function GET() {
  const response = NextResponse.json({
    app: brand.name,
    version: "1.0.0",
    android: {
      versionCode: 21,
      versionName: "2.1.0",
      apkUrl: "https://nok-web.vercel.app/nok-display.apk",
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
