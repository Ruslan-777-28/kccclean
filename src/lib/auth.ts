import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { createUserProfile } from './firestore';
import { uploadAvatar } from './storage';
import { stopUserPresence } from './userPresence';
import { getFirebaseAuth, getFirebaseDb, getFirebaseStorage } from './firebase';

export async function signUp(email: string, password: string, displayName: string, avatarFile: File | null): Promise<User> {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  const storage = getFirebaseStorage();
  
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  let photoURL = `https://picsum.photos/seed/${user.uid}/200/200`;
  if (avatarFile) {
    photoURL = await uploadAvatar(user.uid, avatarFile);
  }

  // Update Firebase Auth profile
  await updateProfile(user, { displayName, photoURL });
  
  // Create user documents in Firestore
  await createUserProfile(user, { displayName, email, photoURL });

  return user;
}

export async function signIn(email: string, password: string): Promise<User> {
    const auth = getFirebaseAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

export async function signOutUser(): Promise<void> {
    const auth = getFirebaseAuth();
    if (auth.currentUser) {
        await stopUserPresence();
    }
    await signOut(auth);
}
