import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// This function is kept for reference but the new implementation uses a direct API call.
// The new implementation is in the GET function below.
export async function generateToken() {
  const API_KEY = process.env.VIDEOSDK_API_KEY;
  const SECRET_KEY = process.env.VIDEOSDK_SECRET;

  if (!API_KEY || !SECRET_KEY) {
    throw new Error("VideoSDK keys are not configured");
  }

  const token = jwt.sign(
    {
      apikey: API_KEY,
      permissions: ["allow_join", "allow_mod"],
    },
    SECRET_KEY,
    { expiresIn: "24h" }
  );
  return token;
}


export async function GET() {
  try {
    const API_KEY = process.env.VIDEOSDK_API_KEY;
    const SECRET = process.env.VIDEOSDK_SECRET; 

    if (!API_KEY || !SECRET) {
      console.error("Missing VideoSDK API Key or Secret in .env");
      return NextResponse.json({ error: "Missing VideoSDK keys" }, { status: 500 });
    }
    
    // The new authentication method for creating a room doesn't use a separate token endpoint for that,
    // but rather a direct API call with the credentials.
    const res = await fetch("https://api.videosdk.live/v2/rooms", {
      method: "POST",
      headers: {
        "authorization": `${API_KEY}:${SECRET}`, // Corrected Authorization
        "Content-Type": "application/json",
      },
       body: JSON.stringify({}),
    });
    
    const data = await res.json();

    if (!res.ok) {
        console.error("VideoSDK API Error:", data);
        return NextResponse.json(data, { status: res.status });
    }
    
    // The token generation logic will now be part of the client-side initialization, 
    // or we can generate it here if needed for a specific room.
    // For now, let's just return the room data.
    // We will generate the token on the client, which is a common pattern.
    
    return NextResponse.json(data);
  } catch (e: any) {
    console.error("Unexpected error in /api/videosdk-token:", e);
    return NextResponse.json({ error: e.message || "Room creation failed" }, { status: 500 });
  }
}
