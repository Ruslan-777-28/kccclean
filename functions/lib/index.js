"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ping = exports.getVideoSDKTokenHttp = exports.getVideoSDKToken = void 0;
const https_1 = require("firebase-functions/v2/https");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
if (!admin.apps.length) {
    admin.initializeApp();
}
// -----------------------------
//  LOAD CONFIG
// -----------------------------
const VIDEOSDK_API_KEY = functions.config().videosdk.api_key;
const VIDEOSDK_SECRET = functions.config().videosdk.secret;
if (!VIDEOSDK_API_KEY || !VIDEOSDK_SECRET) {
    console.error("❌ VideoSDK keys are missing in functions:config");
}
// -----------------------------
//  UTIL: Generate a VideoSDK JWT Token (for client)
// -----------------------------
function generateToken() {
    return jwt.sign({
        apikey: VIDEOSDK_API_KEY,
        permissions: ["allow_join", "allow_mod"], // allow joining + moderator
        version: 2,
        roles: ["rtc"], // client SDK token
    }, VIDEOSDK_SECRET, {
        expiresIn: "120m",
        algorithm: "HS256",
    });
}
// -----------------------------
//  1) Callable Function (PRODUCTION)
//     Requires Firebase Auth
// -----------------------------
exports.getVideoSDKToken = (0, https_1.onCall)({ region: "us-central1" }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Authentication required");
    }
    try {
        const payload = {
            apikey: VIDEOSDK_API_KEY,
            permissions: ["allow_join", "allow_mod"],
            version: 2,
            role: "server", // Server role for creating rooms
        };
        const token = jwt.sign(payload, VIDEOSDK_SECRET, {
            expiresIn: "10m",
            issuer: "https://api.videosdk.live",
        });
        return { token };
    }
    catch (err) {
        console.error("Error creating VideoSDK JWT:", err);
        throw new https_1.HttpsError("internal", "TOKEN_CREATION_FAILED");
    }
});
// -----------------------------
//  2) HTTP Function (TEST / CURL)
//     No Auth Required
// -----------------------------
exports.getVideoSDKTokenHttp = functions.https.onRequest((req, res) => {
    try {
        const token = generateToken();
        res.status(200).send({ token });
    }
    catch (error) {
        console.error("HTTP token error:", error);
        res.status(500).send({ error: error.message });
    }
});
// -----------------------------
// OPTIONAL: Health Check
// -----------------------------
exports.ping = functions.https.onRequest((req, res) => {
    res.status(200).send("pong");
});
