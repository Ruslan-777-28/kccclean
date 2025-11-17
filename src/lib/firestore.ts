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
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserPublic, Call, CallStatus, UserPrivate } from './types';

// --- User Functions ---

export async function createUserPublicProfile(uid: string, data: Omit<UserPublic, 'uid'>): Promise<void> {
  await setDoc(doc(db, 'users_public', uid), { ...data, uid });
}

export async function createUserPrivateProfile(uid: string, data: Omit<UserPrivate, 'uid' | 'email'> & { email: string }): Promise<void> {
  await setDoc(doc(db, 'users_private', uid), { ...data, uid });
}

export async function createUserProfile(uid: string, data: { displayName: string, email: string, photoURL: string }): Promise<void> {
  const publicProfileData = {
    displayName: data.displayName,
    email: data.email,
    photoURL: data.photoURL,
  };
  const privateProfileData = {
    email: data.email,
  };

  await createUserPublicProfile(uid, publicProfileData);
  await createUserPrivateProfile(uid, privateProfileData);
}

export async function getUserProfile(uid: string): Promise<UserPublic | null> {
  const userDoc = await getDoc(doc(db, 'users_public', uid));
  if (userDoc.exists()) {
    return userDoc.data() as UserPublic;
  }
  return null;
}

export async function getAllUsers(): Promise<UserPublic[]> {
  const usersCollection = collection(db, 'users_public');
  const userSnapshot = await getDocs(usersCollection);
  return userSnapshot.docs.map(doc => doc.data() as UserPublic);
}

export async function updateUserAvatar(uid: string, url: string): Promise<void> {
    const userDocRef = doc(db, 'users_public', uid);
    await updateDoc(userDocRef, { photoURL: url });
}


// --- Call Functions ---

export async function createCall(callerId: string, calleeId: string): Promise<string> {
  const callsCollection = collection(db, 'calls');
  const callDoc = await addDoc(callsCollection, {
    callerId,
    calleeId,
    status: 'ringing',
    roomUrl: null,
    createdAt: serverTimestamp(),
  });
  return callDoc.id;
}

export function listenToCall(callId: string, callback: (call: Call | null) => void): Unsubscribe {
  const callDocRef = doc(db, 'calls', callId);
  return onSnapshot(callDocRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as Call);
    } else {
      callback(null);
    }
  });
}

export async function updateCallStatus(callId: string, status: CallStatus) {
  const callDocRef = doc(db, 'calls', callId);
  await updateDoc(callDocRef, { status });
}

export function listenToIncomingCalls(userId: string, callback: (calls: Call[]) => void): Unsubscribe {
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
  });
}
