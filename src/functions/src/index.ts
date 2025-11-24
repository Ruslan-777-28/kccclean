import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as jwt from "jsonwebtoken";

admin.initializeApp();

export const getVideoSDKTokenHttp = functions.https.onRequest(
  (req, res) => {
    // Manual CORS handling
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      const API_KEY = process.env.VIDEOSDK_API_KEY;
      const SECRET = process.env.VIDEOSDK_SECRET_KEY;

      if (!API_KEY || !SECRET) {
        console.error("❌ Missing VideoSDK env vars");
        res.status(500).json({ error: "Server misconfigured" });
        return;
      }

      const payload = {
        apikey: API_KEY,
        permissions: ["allow_join"],
        version: 2, // Must be 2
      };

      const token = jwt.sign(payload, SECRET, {
        expiresIn: "24h",
        algorithm: "HS256",
      });

      res.status(200).json({ token });
    } catch (err) {
      console.error("Error generating VideoSDK token:", err);
      res.status(500).json({ error: "Failed to generate token" });
    }
  }
);
