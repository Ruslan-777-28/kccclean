import { NextResponse } from "next/server";
import * as admin from "firebase-admin";

// Prevent re-initializing admin app
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error("Firebase Admin SDK environment variables are not set.");
  } else {
    if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, "\n");
    }
  
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (error: any) {
      console.error('Firebase admin initialization error', error.stack);
    }
  }
}

let db: admin.firestore.Firestore;
if (admin.apps.length) {
  db = admin.firestore();
}


export async function GET(req: Request) {
  if (!db) {
    return NextResponse.json(
      { error: "Firebase Admin SDK not initialized." },
      { status: 500 }
    );
  }
  
  try {
    const { searchParams } = new URL(req.url);
    const callId = searchParams.get("callId");

    if (!callId) {
      return NextResponse.json({ error: "Missing callId" }, { status: 400 });
    }

    const snap = await db.collection("calls").doc(callId).get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    const data = snap.data();

    if (!data?.roomId) {
      return NextResponse.json(
        { error: "Room not created yet. Callee has not accepted." },
        { status: 404 }
      );
    }

    return NextResponse.json({ roomId: data.roomId });
  } catch (err) {
    console.error("GET /api/get-call-room error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
