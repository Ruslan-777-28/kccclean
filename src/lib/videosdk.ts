
"use client";

import { getFunctions, httpsCallable } from "firebase/functions";
import { getClientServices } from "./firebase";
import type { Functions } from "firebase/functions";

// Get functions instance outside of the function to avoid re-initialization
let functions: Functions | null = null;
if (typeof window !== "undefined") {
    const services = getClientServices();
    functions = services.functions;
}


export async function fetchVideoSDKToken(): Promise<string> {
  if (!functions) {
      throw new Error("Firebase Functions is not initialized.");
  }
  try {
    const getVideoSDKToken = httpsCallable(functions, 'getVideoSDKToken');
    const result = await getVideoSDKToken();
    const token = (result.data as { token: string }).token;
    if (!token) {
        throw new Error("Received empty token from function.");
    }
    return token;
  } catch(error: any) {
    console.error("Error fetching VideoSDK token from function:", error);
    throw new Error(`Failed to fetch VideoSDK token: ${error.message}`);
  }
}

export async function createVideoSDKRoom(token: string): Promise<string> {
  const VIDEOSDK_API_ENDPOINT = "https://api.videosdk.live/v2/rooms";
  try {
    const response = await fetch(VIDEOSDK_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("VideoSDK room create error:", text);
      throw new Error("VideoSDK room creation failed");
    }

    const data = await response.json();
    return data.roomId;
  } catch (error) {
     console.error("Create room error:", error);
     throw new Error("Failed to create VideoSDK room");
  }
}
