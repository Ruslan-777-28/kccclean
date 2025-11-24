import { NextResponse } from "next/server";
import * as jwt from "jsonwebtoken";

export async function GET() {
  const API_KEY = process.env.VIDEOSDK_API_KEY;
  const SECRET_KEY = process.env.VIDEOSDK_SECRET_KEY;

  if (!API_KEY || !SECRET_KEY) {
    return NextResponse.json(
      { error: "VideoSDK API key or secret not configured" },
      { status: 500 }
    );
  }

  try {
    const payload = {
      apikey: API_KEY,
      permissions: ["allow_join", "allow_mod"], // Allow joining and moderation
    };

    const token = jwt.sign(payload, SECRET_KEY, {
      expiresIn: "24h",
      algorithm: "HS256",
    });

    return NextResponse.json({ token });
  } catch (e: any) {
    console.error("Token Generation Error:", e);
    return NextResponse.json(
      { error: e.message || "Server error generating token" },
      { status: 500 }
    );
  }
}
