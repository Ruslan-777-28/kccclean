"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVideoSDKToken = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const jwt = __importStar(require("jsonwebtoken"));
if (!admin.apps.length) {
    admin.initializeApp();
}
const VIDEOSDK_API_KEY = functions.config().videosdk.api_key;
const VIDEOSDK_SECRET = functions.config().videosdk.secret;
// callable-функція: фронт викликає її через Firebase Functions SDK
exports.getVideoSDKToken = functions.https.onCall((data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required");
    }
    if (!VIDEOSDK_API_KEY || !VIDEOSDK_SECRET) {
        throw new functions.https.HttpsError("failed-precondition", "VideoSDK api_key / secret not configured");
    }
    const options = {
        expiresIn: "120m",
        algorithm: "HS256",
    };
    const payload = {
        apikey: VIDEOSDK_API_KEY,
        // дозволяємо одразу заходити в кімнату й модити інших (для MVP)
        permissions: ["allow_join", "allow_mod"],
        version: 2,
        roles: ["rtc"], // токен для клієнтського SDK, не для серверних API
    };
    const token = jwt.sign(payload, VIDEOSDK_SECRET, options);
    return { token };
});
//# sourceMappingURL=index.js.map