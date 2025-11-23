"use client";

import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getClientServices } from "@/lib/firebase";
import { fetchVideoSDKToken, createVideoSDKRoom } from "@/lib/videosdk";

const { db } = getClientServices();

/**
 * Firestore Call Document type:
 * {
 *   id: string;
 *   callerId: string;
 *   calleeId: string;
 *   status: "ringing" | "accepted" | "in-progress" | "ended" | "declined";
 *   roomId?: string;
 *   createdAt?: Timestamp;
 *   updatedAt?: Timestamp;
 * }
 */


/* --------------------------------------------------------
 * 1) startCall()
 * Caller ініціює виклик → створюється Firestore документ
 * ------------------------------------------------------*/
export async function startCall(callerId: string, calleeId: string) {
  if (!db) throw new Error("Firestore is not initialized");
  try {
    const callsRef = collection(db, "calls");

    const callDoc = await addDoc(callsRef, {
      callerId,
      calleeId,
      status: "ringing",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return callDoc.id;
  } catch (err) {
    console.error("startCall error:", err);
    throw new Error("Failed to start call");
  }
}


/* --------------------------------------------------------
 * 2) acceptCall()
 * Callee приймає виклик:
 *  - отримує VideoSDK токен
 *  - створює VideoSDK room
 *  - записує roomId у Firestore
 * ------------------------------------------------------*/
export async function acceptCall(callId: string) {
    if (!db) throw new Error("Firestore is not initialized");
  try {
    const callRef = doc(db, "calls", callId);

    // 1. Отримуємо токен
    const token = await fetchVideoSDKToken();

    // 2. Створюємо кімнату VideoSDK
    const roomId = await createVideoSDKRoom(token);

    // 3. Оновлюємо Firestore документ
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


/* --------------------------------------------------------
 * 3) declineCall()
 * Callee відхиляє виклик
 * ------------------------------------------------------*/
export async function declineCall(callId: string) {
    if (!db) throw new Error("Firestore is not initialized");
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


/* --------------------------------------------------------
 * 4) endCall()
 * (не обов’язково, але корисно)
 * Завершує дзвінок з будь-якої сторони
 * ------------------------------------------------------*/
export async function endCall(callId: string) {
    if (!db) throw new Error("Firestore is not initialized");
  try {
    const callRef = doc(db, "calls", callId);

    await updateDoc(callRef, {
      status: "ended",
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("endCall error:", err);
    throw new Error("Failed to end call");
  }
}
