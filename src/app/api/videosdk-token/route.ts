import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.VIDEOSDK_API_KEY;
  const secretKey = process.env.VIDEOSDK_SECRET_KEY;

  if (!apiKey || !secretKey) {
    return NextResponse.json(
      { error: "Missing VideoSDK API credentials" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch("https://api.videosdk.live/v2/rooms", {
      method: "POST",
      headers: {
        Authorization: `${apiKey}:${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to create room", details: data },
        { status: 401 }
      );
    }

    return NextResponse.json({
      token: data.roomId,
      roomId: data.roomId,
      apiKey,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Server error", details: error },
      { status: 500 }
    );
  }
}
