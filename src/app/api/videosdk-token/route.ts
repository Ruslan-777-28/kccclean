import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export const dynamic = 'force-dynamic' // defaults to auto

export async function GET(request: Request) {
  try {
    const apiKey = process.env.VIDEOSDK_API_KEY;
    const secretKey = process.env.VIDEOSDK_SECRET_KEY;

    if (!apiKey || !secretKey) {
       console.error("VIDEOSDK_API_KEY or VIDEOSDK_SECRET_KEY is not set in .env file");
      return NextResponse.json(
        { error: "Server configuration error: VideoSDK credentials missing." },
        { status: 500 }
      );
    }

    const payload = {
      apikey: apiKey,
      permissions: ["allow_join", "allow_mod"],
      version: 2,
    };

    const token = jwt.sign(payload, secretKey, {
      expiresIn: "24h",
      algorithm: "HS256",
    });
    
    return NextResponse.json({ token });

  } catch (error: any) {
    console.error("Error generating VideoSDK token:", error);
    return NextResponse.json(
      { error: "Failed to generate VideoSDK token." },
      { status: 500 }
    );
  }
}
