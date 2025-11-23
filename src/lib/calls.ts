"use client";

import {
  doc,
  updateDoc,
  serverTimestamp,
  setDoc,
  getDoc,
  addDoc,
  collection
} from "firebase/firestore";
import { getClientServices } from "./firebase";

const { db } = getClientServices();

// -----------------------------
// ІНІЦІАЦІЯ ВИКЛИКУ
// -----------------------------
export async function startCall(callerId: string, calleeId: string) {
  if (!db) throw new Error("Firestore not initialized");

  const callDocRef = await addDoc(collection(db, "calls"), {
    callerId,
    calleeId,
    status: "ringing",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    roomId: null, // roomId створиться після accept
  });

  return callDocRef.id;
}

// -----------------------------
// ПРИЙНЯТТЯ ВИКЛИКУ
// -----------------------------
// Новий спосіб: roomId генеруємо самі на клієнті
export async function acceptCall(callId: string) {
  if (!db) throw new Error("Firestore not initialized");

  const callRef = doc(db, "calls", callId);
  const snap = await getDoc(callRef);

  if (!snap.exists()) {
    throw new Error("Call does not exist");
  }

  // Створюємо roomId локально
  const roomId = crypto.randomUUID();

  await updateDoc(callRef, {
    status: "accepted",
    roomId,
    updatedAt: serverTimestamp(),
  });

  return roomId;
}

// -----------------------------
// ВІДХИЛЕННЯ ВИКЛИКУ
// -----------------------------
export async function declineCall(callId: string) {
  if (!db) throw new Error("Firestore not initialized");

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
  if (!db) throw new Error("Firestore not initialized");

  const callRef = doc(db, "calls", callId);
  await updateDoc(callRef, {
    status: "ended",
    updatedAt: serverTimestamp(),
  });
}
