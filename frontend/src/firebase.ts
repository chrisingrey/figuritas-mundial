import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  type UserCredential,
} from "firebase/auth";

const firebaseApp = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
});

export const firebaseAuth = getAuth(firebaseApp);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export async function signInWithGoogle(): Promise<string> {
  const result: UserCredential = await signInWithPopup(firebaseAuth, googleProvider);
  return result.user.getIdToken();
}

export async function registerWithEmailAndPassword(
  email: string,
  password: string,
  fullname: string,
): Promise<string> {
  const result = await createUserWithEmailAndPassword(firebaseAuth, email, password);

  if (fullname.trim()) {
    await updateProfile(result.user, { displayName: fullname.trim() });
  }

  return result.user.getIdToken(true);
}

export async function signInWithEmailAndPasswordToken(
  email: string,
  password: string,
): Promise<string> {
  const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
  return result.user.getIdToken();
}
