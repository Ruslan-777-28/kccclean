
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
import { httpsCallable, type Functions } from 'firebase/functions';
import type { UserPublic, Call, CallStatus, UserPrivate } from './types';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';

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

export async function createCall(db: Firestore, callerId: string, calleeId: string, callerName: string): Promise<string> {
    const batch = writeBatch(db);

    const callDocRef = doc(collection(db, "calls"));
    const callId = callDocRef.id;

    batch.set(callDocRef, {
        callerId,
        calleeId,
        status: "ringing",
        roomUrl: null,
        createdAt: serverTimestamp(),
    });

    const incomingDocRef = doc(db, "incoming", calleeId);
    batch.set(incomingDocRef, {
        callId,
        callerId,
        callerName,
    });
    
    await batch.commit();

    return callId;
}


export function listenToCall(db: Firestore, callId: string, callback: (call: Call | null) => void): Unsubscribe {
  const callDocRef = doc(db, 'calls', callId);
  return onSnapshot(callDocRef, 
    (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as Call);
      } else {
        callback(null);
      }
    },
    (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: callDocRef.path,
        operation: 'get',
      }, serverError);
      errorEmitter.emit('permission-error', permissionError);
      callback(null);
    }
  );
}

export function listenToIncomingCalls(db: Firestore, userId: string, callback: (calls: Call[]) => void): Unsubscribe {
  const callsRef = collection(db, 'calls');
  const q = query(callsRef, where('calleeId', '==', userId), where('status', '==', 'ringing'), limit(1));
  
  return onSnapshot(q, (snapshot) => {
    const calls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Call));
    callback(calls);
  },
  (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: callsRef.path,
      operation: 'list',
    }, serverError);
    errorEmitter.emit('permission-error', permissionError);
    callback([]);
  });
}

export function updateCallStatus(db: Firestore, callId: string, status: CallStatus): Promise<void> {
  const callDocRef = doc(db, 'calls', callId);
  const dataToUpdate = { status };
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

export async function createDailyRoom(functions: Functions, callId: string) {
  const fn = httpsCallable(functions, "createDailyRoom");
  try {
    const res = await fn({ callId });
    return res.data as { roomUrl: string };
  } catch(error) {
    console.error("Failed to create Daily room:", error);
    throw error;
  }
}
