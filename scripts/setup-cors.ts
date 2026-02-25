/**
 * One-time script to configure CORS on the Firebase Storage bucket.
 * This is required for direct browser uploads via signed URLs.
 *
 * Usage: source .env.local && npx tsx scripts/setup-cors.ts
 */

import "dotenv/config";
import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

async function main() {
  // Load from .env.local if dotenv/config didn't find .env
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const { config } = await import("dotenv");
    config({ path: ".env.local" });
  }

  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}"
  );

  const app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });

  const bucket = getStorage(app).bucket();

  await bucket.setCorsConfiguration([
    {
      origin: ["*"],
      method: ["PUT", "GET", "HEAD", "OPTIONS"],
      responseHeader: [
        "Content-Type",
        "Content-Length",
        "Content-Range",
        "x-goog-resumable",
      ],
      maxAgeSeconds: 3600,
    },
  ]);

  console.log(
    `CORS configured on bucket: ${bucket.name}`
  );
  console.log("Direct browser uploads are now enabled.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to set CORS:", err.message);
  process.exit(1);
});
