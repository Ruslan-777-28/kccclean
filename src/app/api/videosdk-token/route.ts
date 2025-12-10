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
    // The secret is passed in the body for the API call, not used for signing here.
    const SECRET = process.env.VIDEOSDK_SECRET; 

    if (!API_KEY || !SECRET) {
      console.error("Missing VideoSDK API Key or Secret in .env");
      return NextResponse.json({ error: "Missing VideoSDK keys" }, { status: 500 });
    }

    // The official endpoint for generating a token requires a POST request
    const res = await fetch("https://api.videosdk.live/v2/rooms", {
      method: "POST",
      headers: {
        "authorization": API_KEY,
        "Content-Type": "application/json",
      },
       body: JSON.stringify({}), // Sending an empty body is often sufficient
    });

    if (!res.ok) {
        const errorBody = await res.text();
        console.error("VideoSDK API Error:", errorBody);
        return NextResponse.json({ error: `Failed to create room: ${errorBody}` }, { status: res.status });
    }
    
    const { roomId } = await res.json();

    // Now generate the token for this room
     const tokenRes = await fetch("https://api.videosdk.live/v2/auth/token", {
        method: "POST",
        headers: {
            "authorization": API_KEY,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "apikey": API_KEY,
            "permissions": [`allow_join`, `allow_mod`],
            // You might need to add roomId here if required by your setup
        }),
     });
    
     if(!tokenRes.ok) {
        const errorBody = await tokenRes.text();
        console.error("VideoSDK Token Generation Error:", errorBody);
        return NextResponse.json({ error: `Token generation failed: ${errorBody}` }, { status: tokenRes.status });
     }

    const { token } = await tokenRes.json();
    
    return NextResponse.json({ token });
  } catch (e: any) {
    console.error("Unexpected error in /api/videosdk-token:", e);
    return NextResponse.json({ error: e.message || "Token fetch failed" }, { status: 500 });
  }
}