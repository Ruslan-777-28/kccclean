import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from './firebase';
import { createUserProfile } from './firestore';

export async function signUp(email: string, password: string, displayName: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // We are using a placeholder for the photoURL.
  // In a real app, you might want to use a default avatar or a user-uploaded image.
  const photoURL = `https://picsum.photos/seed/${user.uid}/200/200`;

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