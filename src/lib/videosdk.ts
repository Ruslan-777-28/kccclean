"use client";

// Функція отримання токена з твоєї Cloud Function
export async function fetchVideoSDKToken(): Promise<string> {
  const url =
    "https://us-central1-clin-a278c.cloudfunctions.net/getVideoSDKTokenHttp";

  try {
    const response = await fetch(url, { method: "GET" });

    if (!response.ok) {
      throw new Error("Failed to fetch VideoSDK token");
    }

    const data = await response.json();
    return data.token;
  } catch (err) {
    console.error("Failed to fetch VideoSDK token:", err);
    throw new Error("Unable to get VideoSDK token");
  }
}

// -------------------------
// СТВОРЕННЯ КІМНАТИ (v1 API)
// -------------------------

export async function createVideoSDKRoom(): Promise<string> {
  const token = await fetchVideoSDKToken();

  try {
    const response = await fetch("https://api.videosdk.live/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        region: "us",
        autoCloseConfig: {
          enabled: true,
          timeout: 300,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("VideoSDK room create error:", text);
      throw new Error("VideoSDK room creation failed");
    }

    const data = await response.json();
    if (!data.roomId) {
        console.error("VideoSDK: no roomId returned:", data);
        throw new Error("VideoSDK did not return roomId");
    }
    return data.roomId;
  } catch (err) {
      console.error("VideoSDK create room error:", err);
      throw new Error("Unable to create VideoSDK room");
  }
}