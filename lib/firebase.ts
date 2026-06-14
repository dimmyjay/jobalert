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

// Check if required config exists
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  console.warn("⚠️ Firebase API Key is missing. Please check your .env.local or Vercel Environment Variables.");
}

let firebaseApp: FirebaseApp;
let auth: Auth;
let db: Database;

try {
  // Initialize Firebase only if config is present
  if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    firebaseApp = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    db = getDatabase(firebaseApp);
  } else {
    // Throw error during runtime if config is missing but code tries to use it
    throw new Error("Firebase configuration is incomplete.");
  }
} catch (error) {
  console.error("Failed to initialize Firebase:", error);
  // Create dummy instances to prevent build crashes in some environments, 
  // though functionality will be broken until keys are added.
  // In a real app, you might want to handle this more gracefully depending on your needs.
  throw error; 
}

export { firebaseApp, auth, db };