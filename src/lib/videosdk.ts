"use client";

import { getFunctions, httpsCallable } from "firebase/functions";
import { getClientServices } from "@/lib/firebase";

export async function fetchVideoSDKToken(): Promise<string> {
  const { functions } = getClientServices();
  if (!functions) throw new Error("Firebase Functions is not initialized.");

  const callable = httpsCallable(functions, "getVideoSDKToken");
  const res = await callable();
  const data = res.data as { token: string };
  return data.token;
}

export async function createVideoSDKRoom(token: string): Promise<string> {
  const VIDEOSDK_API_ENDPOINT = "https://api.videosdk.live/v2/rooms";

  const res = await fetch(VIDEOSDK_API_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
  });

  if (!res.ok) {
    console.error("Failed to create VideoSDK room", await res.text());
    throw new Error("Failed to create VideoSDK room");
  }

  const { roomId } = await res.json();
  return roomId as string;
}
