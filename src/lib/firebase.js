/**
 * Firebase bootstrap.
 *
 * Config sources (first hit wins):
 *   1. /firebase-applet-config.json  — written by Google AI Studio when you
 *      attach Firebase to the project (may include firestoreDatabaseId)
 *   2. VITE_FIREBASE_* env variables (see .env.example)
 * If neither exists the app runs in local mode (see api/localClient.js).
 */
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const fileCfg = Object.values(
  import.meta.glob("/firebase-applet-config.json", { eager: true, import: "default" })
)[0];

const env = import.meta.env;
const envCfg = env.VITE_FIREBASE_API_KEY
  ? {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.VITE_FIREBASE_APP_ID,
      firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID || undefined,
    }
  : null;

const config = fileCfg || envCfg;

export const isFirebaseConfigured = Boolean(config && config.apiKey && config.projectId);

let app = null, auth = null, db = null, storage = null;
if (isFirebaseConfigured) {
  app = getApps()[0] || initializeApp(config);
  auth = getAuth(app);
  const dbId = config.firestoreDatabaseId;
  try {
    db = dbId && dbId !== "(default)"
      ? initializeFirestore(app, { ignoreUndefinedProperties: true }, dbId)
      : initializeFirestore(app, { ignoreUndefinedProperties: true });
  } catch {
    db = dbId ? getFirestore(app, dbId) : getFirestore(app);
  }
  storage = config.storageBucket ? getStorage(app) : null;
}

export { app, auth, db, storage };
