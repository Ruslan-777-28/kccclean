import { db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const callId = searchParams.get("callId");

  if (!callId) {
    return NextResponse.json({ error: "Missing callId" }, { status: 400 });
  }

  try {
    const snap = await db.collection("calls").doc(callId).get();
    
    if (!snap.exists) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }
    const callData = snap.data();

    if(!callData) {
        return NextResponse.json({ error: "Call data is empty" }, { status: 404 });
    }

    if (!callData.roomId) {
         return NextResponse.json({ error: "Room not created yet. Callee has not accepted." }, { status: 404 });
    }

    return NextResponse.json({ roomId: callData.roomId });
  } catch (error) {
    console.error("Error fetching call document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
