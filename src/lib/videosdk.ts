"use client";

export async function fetchVideoSDKToken(): Promise<string> {
  const url = "https://us-central1-clin-a278c.cloudfunctions.net/getVideoSDKTokenHttp";

  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to get token");

  const data = await response.json();
  return data.token;
}
