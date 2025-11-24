import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, App } from "firebase-admin/app";
import * as admin from 'firebase-admin';

if (!getApps().length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}


const db = getFirestore();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const callId = searchParams.get("callId");

    if (!callId) {
      return NextResponse.json({ error: "Missing callId" }, { status: 400 });
    }

    const docRef = db.collection("calls").doc(callId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    const callData = doc.data();
    if (!callData) {
        return NextResponse.json({ error: "Call data is empty" }, { status: 404 });
    }

    const roomId = callData.roomId;
    if (!roomId) {
        return NextResponse.json({ error: "Room not created yet. Callee has not accepted." }, { status: 404 });
    }


    return NextResponse.json({ roomId });
  } catch (err) {
    console.error("API /get-call-room error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
