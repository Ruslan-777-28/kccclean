import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET() {
  const API_KEY = process.env.NEXT_PUBLIC_VIDEOSDK_API_KEY;
  const SECRET_KEY = process.env.VIDEOSDK_SECRET_KEY;

  if (!API_KEY || !SECRET_KEY) {
    return NextResponse.json(
      { error: "Missing VideoSDK credentials" },
      { status: 500 }
    );
  }

  const payload = {
    apikey: API_KEY,
    permissions: ["allow_join", "allow_mod"],
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "24h" });

  return NextResponse.json({
    token,
    apiKey: API_KEY,
  });
}
