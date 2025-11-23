"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ping = exports.getVideoSDKTokenHttp = exports.getVideoSDKToken = void 0;
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
//  UTIL: Generate a VideoSDK JWT Token
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
exports.getVideoSDKToken = functions.https.onCall((data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required");
    }
    try {
        const token = generateToken();
        return { token };
    }
    catch (error) {
        console.error("Token generation error:", error);
        throw new functions.https.HttpsError("internal", "Failed to generate token");
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
