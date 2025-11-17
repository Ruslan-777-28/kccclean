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
  type Firestore,
} from 'firebase/firestore';
import type { UserPublic, Call, CallStatus, UserPrivate } from './types';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';

// --- User Functions ---

export async function createUserPublicProfile(db: Firestore, uid: string, data: Omit<UserPublic, 'uid'>): Promise<void> {
  const docRef = doc(db, 'users_public', uid);
  setDoc(docRef, { ...data, uid })
    .catch((serverError) => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'create',
        requestResourceData: { ...data, uid },
      }, serverError);
      errorEmitter.emit('permission-error', permissionError);
    });
}

export async function createUserPrivateProfile(db: Firestore, uid: string, data: Omit<UserPrivate, 'uid' | 'email'> & { email: string }): Promise<void> {
  const docRef = doc(db, 'users_private', uid);
  setDoc(docRef, { ...data, uid })
   .catch((serverError) => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'create',
        requestResourceData: { ...data, uid },
      }, serverError);
      errorEmitter.emit('permission-error', permissionError);
    });
}

export async function createUserProfile(db: Firestore, uid: string, data: { displayName: string, email: string, photoURL: string }): Promise<void> {
  const publicProfileData = {
    displayName: data.displayName,
    email: data.email,
    photoURL: data.photoURL,
  };
  const privateProfileData = {
    email: data.email,
  };

  await createUserPublicProfile(db, uid, publicProfileData);
  await createUserPrivateProfile(db, uid, privateProfileData);
}

// NOTE: This function can now only be used in client components
// or server actions where the 'db' instance is passed in.
// For server components that need to fetch data, you should use the Firebase Admin SDK.
// For simplicity in this app, we will convert components that use this to client components.
export async function getUserProfile(db: Firestore, uid: string): Promise<UserPublic | null> {
  const userDoc = await getDoc(doc(db, 'users_public', uid));
  if (userDoc.exists()) {
    return userDoc.data() as UserPublic;
  }
  return null;
}

// See note on getUserProfile
export async function getAllUsers(db: Firestore): Promise<UserPublic[]> {
  const usersCollection = collection(db, 'users_public');
  const userSnapshot = await getDocs(usersCollection);
  return userSnapshot.docs.map(doc => doc.data() as UserPublic);
}

export async function updateUserAvatar(db: Firestore, uid: string, url: string): Promise<void> {
    const userDocRef = doc(db, 'users_public', uid);
    updateDoc(userDocRef, { photoURL: url })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'update',
          requestResourceData: { photoURL: url },
        }, serverError);
        errorEmitter.emit('permission-error', permissionError);
      });
}


// --- Call Functions ---

export async function createCall(db: Firestore, callerId: string, calleeId: string): Promise<string> {
  const callsCollection = collection(db, 'calls');
  const callDocRef = await addDoc(callsCollection, {
    callerId,
    calleeId,
    status: 'ringing',
    roomUrl: null,
    createdAt: serverTimestamp(),
  }).catch((serverError) => {
      const permissionError = new FirestorePermissionError({
        path: callsCollection.path,
        operation: 'create',
        requestResourceData: { callerId, calleeId, status: 'ringing' },
      }, serverError);
      errorEmitter.emit('permission-error', permissionError);
      throw permissionError;
  });
  return callDocRef.id;
}

export function listenToCall(db: Firestore, callId: string, callback: (call: Call | null) => void): Unsubscribe {
  const callDocRef = doc(db, 'calls', callId);
  return onSnapshot(callDocRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as Call);
    } else {
      callback(null);
    }
  }, (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: callDocRef.path,
        operation: 'get',
      }, serverError);
      errorEmitter.emit('permission-error', permissionError);
  });
}

export async function updateCallStatus(db: Firestore, callId: string, status: CallStatus) {
  const callDocRef = doc(db, 'calls', callId);
  updateDoc(callDocRef, { status })
    .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: callDocRef.path,
          operation: 'update',
          requestResourceData: { status },
        }, serverError);
        errorEmitter.emit('permission-error', permissionError);
      });
}

export function listenToIncomingCalls(db: Firestore, userId: string, callback: (calls: Call[]) => void): Unsubscribe {
  const callsCollection = collection(db, 'calls');
  const q = query(
    callsCollection,
    where('calleeId', '==', userId),
    where('status', '==', 'ringing'),
    limit(1) // Usually one incoming call at a time
  );

  return onSnapshot(q, (snapshot) => {
    const calls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Call));
    callback(calls);
  }, (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: callsCollection.path,
        operation: 'list',
      }, serverError);
      errorEmitter.emit('permission-error', permissionError);
  });
}
