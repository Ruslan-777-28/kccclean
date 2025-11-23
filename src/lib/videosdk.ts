"use client";

import { getFunctions, httpsCallable } from "firebase/functions";
import { getClientServices } from "@/lib/firebase";

/**
 * 1) Fetch VideoSDK token via Firebase Callable Function.
 *    This is our secure backend-generated JWT.
 */
export async function fetchVideoSDKToken(): Promise<string> {
  try {
    const { functions } = getClientServices();
    if (!functions) throw new Error("Firebase Functions is not initialized.");

    const callable = httpsCallable(functions, "getVideoSDKToken");

    const response = await callable();
    const data = response.data as any;

    if (!data || !data.token) {
      console.error("VideoSDK token missing in response:", data);
      throw new Error("No VideoSDK token returned from backend");
    }

    return data.token;
  } catch (err) {
    console.error("Failed to fetch VideoSDK token:", err);
    throw new Error("Unable to get VideoSDK token");
  }
}

/**
 * 2) Create VideoSDK Room via REST API.
 *    Requires JWT token from fetchVideoSDKToken().
 */
export async function createVideoSDKRoom(token: string): Promise<string> {
  const endpoint = "https://api.videosdk.live/v2/rooms";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // VideoSDK expects raw token, not "Bearer"
        Authorization: token,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("VideoSDK room create error:", text);
      throw new Error("VideoSDK room creation failed");
    }

    const json = await response.json();

    if (!json.roomId) {
      console.error("VideoSDK: no roomId returned:", json);
      throw new Error("VideoSDK did not return roomId");
    }

    return json.roomId as string;
  } catch (err) {
    console.error("VideoSDK create room error:", err);
    throw new Error("Unable to create VideoSDK room");
  }
}