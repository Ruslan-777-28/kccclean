import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
  type Auth,
} from 'firebase/auth';
import { createUserProfile } from './firestore';
import { uploadAvatar } from './storage';
import type { Firestore, FirebaseStorage } from './firebase';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';

export async function signUp(auth: Auth, db: Firestore, storage: FirebaseStorage, email: string, password: string, displayName: string, avatarFile: File | null): Promise<User> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    let photoURL = `https://picsum.photos/seed/${user.uid}/200/200`;
    if (avatarFile) {
      // The uploadAvatar function now handles its own errors
      photoURL = await uploadAvatar(storage, user.uid, avatarFile);
    }

    // Update Firebase Auth profile
    await updateProfile(user, { displayName, photoURL });
    
    // Create user documents in Firestore
    // The createUserProfile function now handles its own errors
    await createUserProfile(db, user, { displayName, email, photoURL });

    return user;
  } catch (error: any) {
    // Catch auth errors (e.g., email-already-in-use) and re-throw them
    console.error("Authentication error during sign up:", error);
    throw error;
  }
}

export async function signIn(auth: Auth, email: string, password: string): Promise<User> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error("Authentication error during sign in:", error);
    throw error;
  }
}

export async function signOutUser(auth: Auth): Promise<void> {
  await signOut(auth);
}
