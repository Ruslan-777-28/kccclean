import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as jwt from "jsonwebtoken";

if (!admin.apps.length) {
  admin.initializeApp();
}

const VIDEOSDK_API_KEY = functions.config().videosdk.api_key as string;
const VIDEOSDK_SECRET = functions.config().videosdk.secret as string;

export const getVideoSDKToken = functions.https.onCall((data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  if (!VIDEOSDK_API_KEY || !VIDEOSDK_SECRET) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "VideoSDK api_key / secret not configured"
    );
  }

  const token = jwt.sign(
    {
      apikey: VIDEOSDK_API_KEY,
      permissions: ["allow_join", "allow_mod"],
      version: 2,
      roles: ["rtc"]
    },
    VIDEOSDK_SECRET,
    {
      expiresIn: "120m",
      algorithm: "HS256"
    }
  );

  return { token };
});
