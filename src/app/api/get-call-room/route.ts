import { NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// ---- Client Firebase Config ----
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// initialize only once
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const db = getFirestore();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const callId = searchParams.get("callId");

    if (!callId) {
      return NextResponse.json({ error: "Missing callId" }, { status: 400 });
    }

    const callRef = doc(db, "calls", callId);
    const callSnap = await getDoc(callRef);

    if (!callSnap.exists()) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    const callData = callSnap.data();
    if (!callData?.roomId) {
      return NextResponse.json(
        { error: "Room not created yet" },
        { status: 404 }
      );
    }

    return NextResponse.json({ roomId: callData.roomId });
  } catch (err) {
    console.error("API ERROR:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
