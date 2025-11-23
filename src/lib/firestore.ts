
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
import type { UserPublic, Call, CallStatus, UserPrivate } from './types';
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

// --- Call Functions ---

export async function startCall(db: Firestore, callerId: string, calleeId: string, callerName: string): Promise<string> {
    const callsRef = collection(db, "calls");
  
    const callDoc = {
      callerId,
      calleeId,
      callerName,
      status: "ringing" as CallStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    const docRef = await addDoc(callsRef, callDoc);
  
    // Create incoming call notification for callee
    const incomingDocRef = doc(db, "incoming", calleeId);
    await setDoc(incomingDocRef, {
      callId: docRef.id,
      callerId,
      callerName,
      createdAt: serverTimestamp(),
    });

    return docRef.id;
}

export async function acceptCall(db: Firestore, callId: string) {
  const callRef = doc(db, "calls", callId);

  // 1) Get token from Cloud Function
  const token = await fetchVideoSDKToken();

  // 2) Create VideoSDK room
  const roomId = await createVideoSDKRoom(token);

  // 3) Update the call document
  await updateDoc(callRef, {
    status: "accepted",
    roomId,
    updatedAt: serverTimestamp(),
  });
}

export async function declineCall(db: Firestore, callId: string) {
  const callRef = doc(db, "calls", callId);
  await updateDoc(callRef, {
    status: "declined",
    updatedAt: serverTimestamp(),
  });
}

export function updateCallStatus(db: Firestore, callId: string, status: CallStatus): Promise<void> {
  const callDocRef = doc(db, 'calls', callId);
  const dataToUpdate = { status, updatedAt: serverTimestamp() };
  return updateDoc(callDocRef, dataToUpdate)
    .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: callDocRef.path,
          operation: 'update',
          requestResourceData: dataToUpdate,
        }, serverError);
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
      });
}
