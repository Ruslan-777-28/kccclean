import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET() {
  try {
    const apiKey = process.env.VIDEOSDK_API_KEY;
    const secretKey = process.env.VIDEOSDK_SECRET_KEY;

    if (!apiKey || !secretKey) {
      return NextResponse.json(
        { error: "Missing VideoSDK API or Secret Key" },
        { status: 500 }
      );
    }

    // Generate VideoSDK JWT
    const payload = {
      apikey: apiKey,
      permissions: ["allow_join", "allow_mod"],
    };

    const token = jwt.sign(payload, secretKey, {
      expiresIn: "10m",
      algorithm: "HS256",
    });

    return NextResponse.json({ token });
  } catch (error: any) {
    console.error("VideoSDK token error:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
