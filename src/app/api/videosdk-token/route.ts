import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_VIDEOSDK_API_KEY;
  const secretKey = process.env.VIDEOSDK_SECRET_KEY;

  if (!apiKey || !secretKey) {
    return NextResponse.json(
      { error: "Missing VideoSDK API credentials" },
      { status: 500 }
    );
  }

  const payload = {
    iss: apiKey,
    sub: "videoSDK",
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  };

  const token = jwt.sign(payload, secretKey);

  return NextResponse.json({
    token,
    apiKey,
  });
}
