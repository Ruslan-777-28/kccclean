"use client";

export async function fetchVideoSDKToken(): Promise<string> {
  const url = "https://us-central1-clin-a278c.cloudfunctions.net/getVideoSDKTokenHttp";

  try {
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get token: ${response.status} ${errorText}`);
    }
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error("Fetch token error:", error);
    throw new Error("Failed to fetch VideoSDK token");
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
