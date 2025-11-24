
"use client";

export async function fetchVideoSDKToken(): Promise<string> {
  try {
    const response = await fetch("/api/videosdk-token", {
      method: "GET",
      cache: "no-store",
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch VideoSDK token: ${response.status} ${errorText}`);
    }
    const { token } = await response.json();
    if (!token) {
        throw new Error("Received empty token from API.");
    }
    return token;
  } catch(error: any) {
    console.error("Error fetching VideoSDK token:", error);
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
