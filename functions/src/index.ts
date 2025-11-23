import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as jwt from "jsonwebtoken";

admin.initializeApp();

export const getVideoSDKTokenHttp = functions.https.onRequest(
  async (req, res) => {
    try {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "GET");
      res.set("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      const API_KEY = process.env.VIDEOSDK_API_KEY;
      const SECRET = process.env.VIDEOSDK_SECRET_KEY;

      if (!API_KEY || !SECRET) {
        console.error("❌ Missing VideoSDK env vars");
        res.status(500).json({ error: "Env vars missing" });
        return;
      }

      // Create a server-side JWT token
      const token = jwt.sign(
        {
          apikey: API_KEY,
          permissions: ["allow_join", "allow_mod"],
          role: "server", // This is crucial for creating rooms
        },
        SECRET,
        { expiresIn: "10m", algorithm: "HS256" }
      );

      res.status(200).json({ token });
    } catch (err) {
      console.error("Error generating VideoSDK token:", err);
      res.status(500).json({ error: "Internal error" });
    }
  }
);
