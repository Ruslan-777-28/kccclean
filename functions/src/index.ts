import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import jwt from "jsonwebtoken";

admin.initializeApp();

export const getVideoSDKTokenHttp = functions.https.onRequest(
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    try {
      const apiKey = functions.config().videosdk.api_key;
      const secret = functions.config().videosdk.secret;

      if (!apiKey || !secret) {
        return res.status(500).json({ error: "Missing VideoSDK keys" });
      }

      const payload = {
        apikey: apiKey,
        permissions: ["allow_join", "allow_mod"],
        // ГОЛОВНЕ:
        role: "server",
      };

      const token = jwt.sign(payload, secret, {
        expiresIn: "24h",
        algorithm: "HS256",
      });

      return res.json({ token });
    } catch (err) {
      console.error("VideoSDK token error:", err);
      return res.status(500).json({ error: "Failed to generate token" });
    }
  }
);
