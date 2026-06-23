// lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
  type Auth,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

const requiredFirebaseKeys = Object.entries(firebaseConfig).filter(
  ([, value]) => !value.trim(),
);

export const isFirebaseConfigured = requiredFirebaseKeys.length === 0;
export const firebaseConfigError = isFirebaseConfigured
  ? null
  : `Firebase is disabled. Missing: ${requiredFirebaseKeys
      .map(([key]) => key)
      .join(", ")}`;

if (!isFirebaseConfigured && typeof window !== "undefined") {
  console.warn(firebaseConfigError);
}

const appInstance: FirebaseApp | null = isFirebaseConfigured
  ? !getApps().length
    ? initializeApp(firebaseConfig)
    : getApps()[0]
  : null;

export const app = appInstance as FirebaseApp;
export const auth = (appInstance ? getAuth(appInstance) : null) as Auth;
export const db = (appInstance ? getFirestore(appInstance) : null) as Firestore;
export const storage = (appInstance
  ? getStorage(appInstance)
  : null) as FirebaseStorage;

// Optionally set local persistence for auth
// (call once before signIn/createUserWithEmailAndPassword)
export async function setLocalPersistence() {
  if (!isFirebaseConfigured || !appInstance) {
    throw new Error(firebaseConfigError || "Firebase is not configured");
  }
  await setPersistence(auth, browserLocalPersistence);
}
