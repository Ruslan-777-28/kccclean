"use client";

import {
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
  addDoc,
  collection,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";


// -----------------------------
// ІНІЦІАЦІЯ ВИКЛИКУ
// -----------------------------
export async function startCall(callerId: string, calleeId: string) {
  const db = getFirebaseDb();

  const callDocRef = await addDoc(collection(db, "calls"), {
    callerId,
    calleeId,
    status: "ringing",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    roomId: null, // roomId is now the callId itself
  });

  // The roomId for Cloudflare will be the document ID of the call
  await updateDoc(callDocRef, { roomId: callDocRef.id });

  return callDocRef.id;
}

// -----------------------------
// ПРИЙНЯТТЯ ВИКЛИКУ
// -----------------------------
export async function acceptCall(callId: string) {
  const db = getFirebaseDb();

  const callRef = doc(db, "calls", callId);
  const snap = await getDoc(callRef);

  if (!snap.exists()) {
    throw new Error("Call does not exist");
  }

  // With Cloudflare, we don't need to create a room here.
  // The room is implicitly created when the host joins.
  // We just update the status.
  await updateDoc(callRef, {
    status: "accepted",
    updatedAt: serverTimestamp(),
  });

  return callId; // The roomId is the callId
}

// -----------------------------
// ВІДХИЛЕННЯ ВИКЛИКУ
// -----------------------------
export async function declineCall(callId: string) {
  const db = getFirebaseDb();
  const callRef = doc(db, "calls", callId);
  await updateDoc(callRef, {
    status: "declined",
    updatedAt: serverTimestamp(),
  });
}

// -----------------------------
// ЗАВЕРШЕННЯ ВИКЛИКУ
// -----------------------------
export async function endCall(callId: string) {
  const db = getFirebaseDb();
  const callRef = doc(db, "calls", callId);
  await updateDoc(callRef, {
    status: "ended",
    updatedAt: serverTimestamp(),
  });
}
