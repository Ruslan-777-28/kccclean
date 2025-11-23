"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVideoSDKToken = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
if (!admin.apps.length) {
    admin.initializeApp();
}
const VIDEOSDK_API_KEY = functions.config().videosdk.api_key;
const VIDEOSDK_SECRET = functions.config().videosdk.secret;
exports.getVideoSDKToken = functions.https.onCall((data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required");
    }
    if (!VIDEOSDK_API_KEY || !VIDEOSDK_SECRET) {
        throw new functions.https.HttpsError("failed-precondition", "VideoSDK api_key / secret not configured");
    }
    const token = jwt.sign({
        apikey: VIDEOSDK_API_KEY,
        permissions: ["allow_join", "allow_mod"],
        version: 2,
        roles: ["rtc"]
    }, VIDEOSDK_SECRET, {
        expiresIn: "120m",
        algorithm: "HS256"
    });
    return { token };
});
