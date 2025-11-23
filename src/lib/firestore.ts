
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  limit,
  Unsubscribe,
  writeBatch,
  type Firestore,
  type User,
  type Timestamp,
} from 'firebase/firestore';
import type { UserPublic, UserPrivate } from './types';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';
import { createVideoSDKRoom, fetchVideoSDKToken } from './videosdk';

// --- User Functions ---

export function createUserProfile(db: Firestore, user: User, data: { displayName: string, email: string, photoURL: string }): Promise<void> {
  const batch = writeBatch(db);

  const publicDocRef = doc(db, 'users_public', user.uid);
  const publicProfileData: Omit<UserPublic, 'lastActive'> = {
    uid: user.uid,
    displayName: data.displayName,
    email: data.email,
    photoURL: data.photoURL,
    isOnline: false,
  };
  batch.set(publicDocRef, {
    ...publicProfileData,
    lastActive: serverTimestamp(),
  });

  const privateDocRef = doc(db, 'users_private', user.uid);
  const privateProfileData: UserPrivate = {
    uid: user.uid,
    email: data.email,
  };
  batch.set(privateDocRef, privateProfileData);

  return batch.commit().catch((serverError) => {
    const permissionError = new FirestorePermissionError({
      path: publicDocRef.path,
      operation: 'create',
      requestResourceData: { public: publicProfileData, private: privateProfileData },
    }, serverError);
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
}

export async function getUserProfile(db: Firestore, uid: string): Promise<UserPublic | null> {
  const userDocRef = doc(db, 'users_public', uid);
  try {
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return { uid: userDoc.id, ...userDoc.data() } as UserPublic;
    }
    return null;
  } catch (serverError) {
    const permissionError = new FirestorePermissionError({
      path: userDocRef.path,
      operation: 'get',
    }, serverError);
    errorEmitter.emit('permission-error', permissionError);
    return null;
  }
}

export function updateUserAvatar(db: Firestore, uid: string, url: string): Promise<void> {
    const userDocRef = doc(db, 'users_public', uid);
    const dataToUpdate = { photoURL: url };
    return updateDoc(userDocRef, dataToUpdate)
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'update',
          requestResourceData: dataToUpdate,
        }, serverError);
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
      });
}
