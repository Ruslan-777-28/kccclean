"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVideoSDKTokenHttp = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const jsonwebtoken_1 = require("jsonwebtoken");
admin.initializeApp();
// Читаємо ключі з .env (firebase functions:config:set ...)
const VIDEOSDK_API_KEY = functions.config().videosdk.key;
const VIDEOSDK_SECRET = functions.config().videosdk.secret;
// -------------------------
// 1st Gen HTTP FUNCTION
// -------------------------
exports.getVideoSDKTokenHttp = functions.https.onRequest(async (req, res) => {
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
        const token = jsonwebtoken_1.default.sign(payload, VIDEOSDK_SECRET, {
            expiresIn: "24h",
            algorithm: "HS256",
        });
        res.status(200).json({ token });
    }
    catch (err) {
        console.error("Error generating VideoSDK token:", err);
        res.status(500).send("Failed to generate token");
    }
});
