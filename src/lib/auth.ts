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
import { stopUserPresence } from './userPresence';
import type { Firestore, FirebaseStorage } from './firebase';

export async function signUp(auth: Auth, db: Firestore, storage: FirebaseStorage, email: string, password: string, displayName: string, avatarFile: File | null): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  let photoURL = `https://picsum.photos/seed/${user.uid}/200/200`;
  if (avatarFile) {
    photoURL = await uploadAvatar(storage, user.uid, avatarFile);
  }

  // Update Firebase Auth profile
  await updateProfile(user, { displayName, photoURL });
  
  // Create user documents in Firestore
  await createUserProfile(db, user, { displayName, email, photoURL });

  return user;
}

export async function signIn(auth: Auth, email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

export async function signOutUser(auth: Auth, db: Firestore): Promise<void> {
    if (auth.currentUser) {
        await stopUserPresence(db, auth.currentUser);
    }
    await signOut(auth);
}
