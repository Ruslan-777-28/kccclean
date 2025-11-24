import { NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// Protect against undefined env
function safeEnv(value: string | undefined, name: string) {
  if (!value) {
    console.warn(`⚠️ Missing env: ${name}`);
    return "";
  }
  return value;
}

const firebaseConfig = {
  apiKey: safeEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY, "API_KEY"),
  authDomain: safeEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, "AUTH_DOMAIN"),
  projectId: safeEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, "PROJECT_ID"),
  storageBucket: safeEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, "STORAGE_BUCKET"),
  messagingSenderId: safeEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, "MSG_SENDER"),
  appId: safeEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID, "APP_ID"),
};

// Moved Firebase initialization inside the request handler
// to ensure it runs in the correct serverless function context.
let app: ReturnType<typeof getApp>;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);


// ------------------
// GET /api/get-call-room?callId=123
// ------------------
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const callId = url.searchParams.get("callId");

    if (!callId) {
      return NextResponse.json({ error: "Missing callId" }, { status: 400 });
    }

    const ref = doc(db, "calls", callId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    const data = snap.data() as any;

    if (!data.roomId) {
      return NextResponse.json(
        { error: "Room not created yet. Callee has not accepted." },
        { status: 404 }
      );
    }

    return NextResponse.json({ roomId: data.roomId });
  } catch (err) {
    console.error("❌ API /get-call-room failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
