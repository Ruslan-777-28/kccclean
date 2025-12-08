import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET() {
  const API_KEY = process.env.VIDEOSDK_API_KEY;
  const SECRET_KEY = process.env.VIDEOSDK_SECRET;

  if (!API_KEY || !SECRET_KEY) {
    return NextResponse.json(
      { error: "VideoSDK keys missing" },
      { status: 500 }
    );
  }

  const token = jwt.sign(
    {
      apikey: API_KEY,
      permissions: ["allow_join", "allow_mod"],
    },
    SECRET_KEY,
    { expiresIn: "24h" }
  );

  return NextResponse.json({ token });
}
