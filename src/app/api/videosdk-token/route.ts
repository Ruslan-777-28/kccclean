import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET() {
  const API_KEY = process.env.VIDEOSDK_API_KEY;
  const SECRET_KEY = process.env.VIDEOSDK_SECRET_KEY;

  if (!API_KEY || !SECRET_KEY) {
    return NextResponse.json(
      { error: "Missing VideoSDK credentials" },
      { status: 500 }
    );
  }

  const payload = {
    apikey: API_KEY,
    version: 2,
    permissions: ["allow_join", "allow_mod", "allow_publish"],
  };

  const token = jwt.sign(payload, SECRET_KEY, {
    algorithm: "HS256",
    expiresIn: "24h",
  });

  return NextResponse.json({ token });
}
