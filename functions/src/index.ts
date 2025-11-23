import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import * as cors from "cors";
import * as jwt from "jsonwebtoken";

admin.initializeApp();

const corsHandler = cors({ origin: true });

export const getVideoSDKTokenHttp = functions.https.onRequest(
  (req, res) => {
    corsHandler(req, res, () => {
      try {
        const API_KEY = functions.config().videosdk.key;
        const SECRET = functions.config().videosdk.secret;

        if (!API_KEY || !SECRET) {
          console.error("Missing env vars", { API_KEY, SECRET });
          return res.status(500).json({ error: "Server misconfigured" });
        }

        const payload = {
          apikey: API_KEY,
          permissions: ["allow_join", "allow_mod"],
          role: "server",
        };

        const token = jwt.sign(payload, SECRET, {
          expiresIn: "24h",
          algorithm: "HS256",
        });

        return res.status(200).json({ token });
      } catch (err) {
        console.error("Token generation error:", err);
        return res.status(500).json({ error: "Token generation failed" });
      }
    });
  }
);
