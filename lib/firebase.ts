import { getApps, initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getDatabase, Database } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Database | null = null;

// Only initialize if we have an API key
if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  try {
    firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(firebaseApp);
    db = getDatabase(firebaseApp);
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
} else {
  // During build, if env vars are missing, we log a warning but DON'T throw.
  // This allows the build to complete. The app will fail at runtime if keys are truly missing.
  if (typeof window === 'undefined') {
    console.warn("⚠️ Firebase Env Vars missing. Build will proceed, but app may not work locally.");
  }
}

// Export safe accessors
export const getFirebaseApp = () => {
  if (!firebaseApp) throw new Error("Firebase not initialized. Check environment variables.");
  return firebaseApp;
};

export const getAuthInstance = () => {
  if (!auth) throw new Error("Auth not initialized. Check environment variables.");
  return auth;
};

export const getDbInstance = () => {
  if (!db) throw new Error("Database not initialized. Check environment variables.");
  return db;
};

// For backward compatibility with existing imports
export { firebaseApp, auth, db };
