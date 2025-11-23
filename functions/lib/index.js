"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVideoSDKTokenHttp = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
admin.initializeApp();
// ===============================
// 1) GET VideoSDK TOKEN (Admin)
// ===============================
exports.getVideoSDKTokenHttp = functions.https.onRequest(async (req, res) => {
    try {
        res.set("Access-Control-Allow-Origin", "*");
        res.set("Access-Control-Allow-Methods", "GET");
        res.set("Access-Control-Allow-Headers", "Content-Type");
        if (req.method === "OPTIONS") {
            return res.status(204).send("");
        }
        const API_KEY = process.env.VIDEOSDK_API_KEY;
        const SECRET = process.env.VIDEOSDK_SECRET_KEY;
        if (!API_KEY || !SECRET) {
            console.error("❌ Missing VideoSDK env vars");
            return res.status(500).json({ error: "Env vars missing" });
        }
        // Create a server-side JWT token
        const token = jwt.sign({
            apikey: API_KEY,
            permissions: ["allow_join", "allow_mod"],
        }, SECRET, { expiresIn: "10m" });
        return res.status(200).json({ token });
    }
    catch (err) {
        console.error("Error generating VideoSDK token:", err);
        return res.status(500).json({ error: "Internal error" });
    }
});
