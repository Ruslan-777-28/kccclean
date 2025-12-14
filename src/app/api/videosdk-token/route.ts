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
    // 1) Генеруємо JWT токен
    const token = jwt.sign(
      {
        apikey: apiKey,
        permissions: ["allow_join", "allow_mod"],
      },
      secretKey,
      { expiresIn: "24h" }
    );

    // 2) Створюємо кімнату
    const createRoom = await fetch("https://api.videosdk.live/v2/rooms", {
      method: "POST",
      headers: {
        Authorization: `${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const roomData = await createRoom.json();

    if (!createRoom.ok) {
      return NextResponse.json(
        { error: "Failed to create room", details: roomData },
        { status: 401 }
      );
    }

    return NextResponse.json({
      token,
      roomId: roomData.roomId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Server Error", details: String(error) },
      { status: 500 }
    );
  }
}
