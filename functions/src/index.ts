import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as jwt from "jsonwebtoken";

if (!admin.apps.length) {
  admin.initializeApp();
}

const VIDEOSDK_API_KEY = functions.config().videosdk.api_key as string;
const VIDEOSDK_SECRET = functions.config().videosdk.secret as string;

// callable-функція: фронт викликає її через Firebase Functions SDK
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

  const options: jwt.SignOptions = {
    expiresIn: "120m",
    algorithm: "HS256",
  };

  const payload = {
    apikey: VIDEOSDK_API_KEY,
    // дозволяємо одразу заходити в кімнату й модити інших (для MVP)
    permissions: ["allow_join", "allow_mod"],
    version: 2,
    roles: ["rtc"], // токен для клієнтського SDK, не для серверних API
  };

  const token = jwt.sign(payload, VIDEOSDK_SECRET, options);

  return { token };
});
