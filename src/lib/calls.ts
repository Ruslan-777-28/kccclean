"use client";

import {
  doc,
  updateDoc,
  serverTimestamp,
  setDoc,
  getDoc,
  addDoc,
  collection,
} from "firebase/firestore";
import { getClientServices } from "./firebase";
import { fetchVideoSDKToken, createVideoSDKRoom } from "./videosdk";

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
    roomId: null,
  });

  return callDocRef.id;
}

// -----------------------------
// ПРИЙНЯТТЯ ВИКЛИКУ
// -----------------------------
export async function acceptCall(callId: string) {
  if (!db) throw new Error("Firestore not initialized");

  const callRef = doc(db, "calls", callId);
  const snap = await getDoc(callRef);

  if (!snap.exists()) {
    throw new Error("Call does not exist");
  }

  // 1️⃣ Отримуємо VideoSDK токен
  const token = await fetchVideoSDKToken();
  if (!token) throw new Error("Failed to obtain VideoSDK token");

  // 2️⃣ Створюємо кімнату на VideoSDK
  const roomId = await createVideoSDKRoom(token);
  if (!roomId) throw new Error("Failed to create VideoSDK room");

  // 3️⃣ Оновлюємо Firestore
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
