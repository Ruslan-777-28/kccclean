import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET() {
  const API_KEY = process.env.VIDEOSDK_API_KEY;
  const SECRET = process.env.VIDEOSDK_SECRET_KEY;

  if (!API_KEY || !SECRET) {
    return NextResponse.json(
      { error: "Missing VideoSDK API credentials" },
      { status: 500 }
    );
  }

  try {
    // 1) Створюємо **JWT токен**
    const token = jwt.sign(
      {
        apikey: API_KEY,
        permissions: ["allow_join", "allow_mod"],
      },
      SECRET,
      { expiresIn: "24h" }
    );

    // 2) Створюємо кімнату через VideoSDK API
    const roomRes = await fetch("https://api.videosdk.live/v2/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const room = await roomRes.json();

    if (!roomRes.ok) {
      return NextResponse.json(
        { error: "Failed to create room", details: room },
        { status: 401 }
      );
    }

    return NextResponse.json({
      roomId: room.roomId,
      token,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Server error", details: error },
      { status: 500 }
    );
  }
}
