import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as jwt from "jsonwebtoken";

admin.initializeApp();

// Читаємо ключі з .env (firebase functions:config:set ...)
const VIDEOSDK_API_KEY = functions.config().videosdk.key;
const VIDEOSDK_SECRET = functions.config().videosdk.secret;

// -------------------------
// 1st Gen HTTP FUNCTION
// -------------------------
export const getVideoSDKTokenHttp = functions.https.onRequest(
  async (req, res): Promise<void> => {
    // Дозволимо лише GET
    if (req.method !== "GET") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const payload = {
        apikey: VIDEOSDK_API_KEY,
        permissions: ["allow_join"],
        version: 2,
      };

      const token = jwt.sign(payload, VIDEOSDK_SECRET, {
        expiresIn: "24h",
        algorithm: "HS256",
      });

      res.status(200).json({ token });
    } catch (err) {
      console.error("Error generating VideoSDK token:", err);
      res.status(500).send("Failed to generate token");
    }
  }
);
