import { NextResponse } from "next/server";

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
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  };

  const token = Buffer.from(JSON.stringify(payload)).toString("base64");

  return NextResponse.json({
    token,
    roomId: crypto.randomUUID().slice(0, 12),
  });
}
