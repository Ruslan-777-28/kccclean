import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';
import { createUserProfile } from './firestore';
import { uploadAvatar } from './storage';

export async function signUp(email: string, password: string, displayName: string, avatarFile: File | null): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Default avatar, or upload a new one
  let photoURL = `https://picsum.photos/seed/${user.uid}/200/200`;
  if (avatarFile) {
    photoURL = await uploadAvatar(user.uid, avatarFile);
  }

  // Update Firebase Auth profile
  await updateProfile(user, { displayName, photoURL });
  
  // Create user documents in Firestore
  await createUserProfile(user.uid, { displayName, email, photoURL });

  return user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}
