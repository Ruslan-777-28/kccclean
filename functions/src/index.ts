import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as jwt from "jsonwebtoken";

if (!admin.apps.length) {
  admin.initializeApp();
}

// -----------------------------
//  LOAD CONFIG
// -----------------------------
const VIDEOSDK_API_KEY = functions.config().videosdk.api_key as string;
const VIDEOSDK_SECRET = functions.config().videosdk.secret as string;

if (!VIDEOSDK_API_KEY || !VIDEOSDK_SECRET) {
  console.error("❌ VideoSDK keys are missing in functions:config");
}

// -----------------------------
//  UTIL: Generate a VideoSDK JWT Token (for client)
// -----------------------------
function generateToken() {
  return jwt.sign(
    {
      apikey: VIDEOSDK_API_KEY,
      permissions: ["allow_join", "allow_mod"], // allow joining + moderator
      version: 2,
      roles: ["rtc"], // client SDK token
    },
    VIDEOSDK_SECRET,
    {
      expiresIn: "120m",
      algorithm: "HS256",
    }
  );
}

// -----------------------------
//  1) Callable Function (PRODUCTION)
//     Requires Firebase Auth
// -----------------------------
export const getVideoSDKToken = onCall({ region: "us-central1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  try {
    const payload = {
      apikey: VIDEOSDK_API_KEY,
      permissions: ["allow_join", "allow_mod"],
      version: 2,
      role: "server", // Server role for creating rooms
    };

    const token = jwt.sign(payload, VIDEOSDK_SECRET, {
      expiresIn: "10m",
      issuer: "https://api.videosdk.live",
    });

    return { token };
  } catch (err) {
    console.error("Error creating VideoSDK JWT:", err);
    throw new HttpsError("internal", "TOKEN_CREATION_FAILED");
  }
});


// -----------------------------
//  2) HTTP Function (TEST / CURL)
//     No Auth Required
// -----------------------------
export const getVideoSDKTokenHttp = functions.https.onRequest(
  (req, res) => {
    try {
      const token = generateToken();
      res.status(200).send({ token });
    } catch (error: any) {
      console.error("HTTP token error:", error);
      res.status(500).send({ error: error.message });
    }
  }
);

// -----------------------------
// OPTIONAL: Health Check
// -----------------------------
export const ping = functions.https.onRequest((req, res) => {
  res.status(200).send("pong");
});
