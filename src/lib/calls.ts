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
import { createVideoSDKRoom } from "./videosdk";
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
    roomId: null,
  });

  return callDocRef.id;
}

// -----------------------------
// ПРИЙНЯТТЯ ВИКЛИКУ
// -----------------------------
export async function acceptCall(callId: string) {
  if (!db) throw new Error("Firestore not initialized");

  try {
    const callRef = doc(db, "calls", callId);
    const snap = await getDoc(callRef);

    if (!snap.exists()) {
      throw new Error("Call does not exist");
    }

    // Створити кімнату VideoSDK
    const roomId = await createVideoSDKRoom();

    // Оновити статус
    await updateDoc(callRef, {
      status: "accepted",
      roomId,
      updatedAt: serverTimestamp(),
    });

    return roomId;
  } catch (err) {
    console.error("acceptCall error:", err);
    throw new Error("Failed to accept call");
  }
}

// -----------------------------
// ВІДХИЛЕННЯ ВИКЛИКУ
// -----------------------------
export async function declineCall(callId: string) {
    if (!db) throw new Error("Firestore not initialized");
    try {
        const callRef = doc(db, "calls", callId);
        await updateDoc(callRef, {
            status: "declined",
            updatedAt: serverTimestamp(),
        });
    } catch (err) {
        console.error("declineCall error:", err);
        throw new Error("Failed to decline call");
    }
}


// -----------------------------
// ЗАВЕРШЕННЯ ВИКЛИКУ
// -----------------------------
export async function endCall(callId: string) {
  if (!db) throw new Error("Firestore not initialized");
  try {
    const callRef = doc(db, "calls", callId);

    await updateDoc(callRef, {
      status: "ended",
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("endCall error:", err);
  }
}
