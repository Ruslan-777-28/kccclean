import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from './firebase';
import { createUserProfile } from './firestore';
import { uploadAvatar } from './storage';

export async function signUp(email: string, password: string, displayName: string, avatarFile: File | null) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  let photoURL = `https://picsum.photos/seed/${user.uid}/200/200`;

  if (avatarFile) {
    photoURL = await uploadAvatar(user.uid, avatarFile);
  }

  await updateProfile(user, { displayName, photoURL });
  await createUserProfile(user.uid, { displayName, email, photoURL });

  return user;
}

export async function signIn(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function signOutUser() {
  await signOut(auth);
}
