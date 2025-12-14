import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET() {
  const API_KEY = process.env.VIDEOSDK_API_KEY;        // public api key
  const SECRET_KEY = process.env.VIDEOSDK_SECRET_KEY;  // private secret key

  if (!API_KEY || !SECRET_KEY) {
    return NextResponse.json(
      { error: "Missing VideoSDK env vars" },
      { status: 500 }
    );
  }

  const payload = {
    apikey: API_KEY,        // STRICT name → MUST be "apikey"
    permissions: ["allow_join", "allow_mod"],
  };

  const token = jwt.sign(payload, SECRET_KEY, {
    expiresIn: "24h",
  });

  return NextResponse.json({ token });
}
