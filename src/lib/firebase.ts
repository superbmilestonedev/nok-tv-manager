import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

let app: App;

function getFirebaseApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}"
  );

  app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });

  return app;
}

export function getStorageBucket() {
  const app = getFirebaseApp();
  return getStorage(app).bucket();
}
