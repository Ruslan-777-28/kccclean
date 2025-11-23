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
//  UTIL: Generate a VideoSDK JWT Token
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
export const getVideoSDKToken = functions.https.onCall((data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  try {
    const token = generateToken();
    return { token };
  } catch (error: any) {
    console.error("Token generation error:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to generate token"
    );
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
