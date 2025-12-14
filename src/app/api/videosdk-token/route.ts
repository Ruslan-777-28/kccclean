import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

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
    // 1. Генеруємо JWT токен
    const token = jwt.sign(
      {
        apikey: apiKey,
        permissions: ["allow_join", "allow_mod"],
      },
      secretKey,
      { expiresIn: "24h" }
    );

    // 2. Створюємо кімнату VideoSDK
    const res = await fetch("https://api.videosdk.live/v2/rooms", {
      method: "POST",
      headers: {
        Authorization: token,
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
      token,
      roomId: data.roomId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Server error", details: error },
      { status: 500 }
    );
  }
}

