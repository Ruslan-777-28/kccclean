
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as jwt from "jsonwebtoken";

admin.initializeApp();

export const getVideoSDKToken = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to get a token."
    );
  }

  const API_KEY = process.env.VIDEOSDK_API_KEY;
  const SECRET = process.env.VIDEOSDK_SECRET_KEY;

  if (!API_KEY || !SECRET) {
    console.error("❌ Missing VideoSDK env vars on the server.");
    throw new functions.https.HttpsError(
      "internal",
      "Server is misconfigured. Cannot generate a token."
    );
  }

  try {
    const payload = {
      apikey: API_KEY,
      // Add necessary permissions
      permissions: ["allow_join", "allow_mod"],
      version: 2, // Must be 2
      // Associate the token with the Firebase user
      userId: context.auth.uid, 
    };

    const token = jwt.sign(payload, SECRET, {
      expiresIn: "24h",
      algorithm: "HS256",
    });

    return { token };
  } catch (err) {
    console.error("Error generating VideoSDK token:", err);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to generate VideoSDK token."
    );
  }
});
