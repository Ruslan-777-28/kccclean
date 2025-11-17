import { onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";
import { getFirestore } from "firebase-admin/firestore";
import fetch from "node-fetch";

// Ініціалізація Firebase Admin
import { initializeApp } from "firebase-admin/app";
initializeApp();

// Підключаємо секрет DAILY_API_KEY
const DAILY_API_KEY = defineSecret("DAILY_API_KEY");

export const createDailyRoom = onCall(
  { secrets: [DAILY_API_KEY] },
  async (request) => {
    try {
      const { callId } = request.data;

      if (!request.auth) {
        throw new Error("Not authenticated");
      }

      if (!callId) {
        throw new Error("Missing callId");
      }

      // --- 1. Створюємо кімнату Daily ---
      const response = await fetch("https://api.daily.co/v1/rooms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DAILY_API_KEY.value()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            exp: Math.floor(Date.now() / 1000) + 60 * 60,
            enable_screenshare: true,
            enable_chat: true,
            eject_at_room_exp: true,
            max_participants: 2,
          },
        }),
      });

      const data: { url?: string; [key: string]: any } = await response.json() as any;

      if (!data.url) {
        logger.error("Daily API error:", data);
        throw new Error("Failed to create Daily room");
      }

      const roomUrl = data.url;

      // --- 2. Зберігаємо roomUrl у Firestore ---
      const db = getFirestore();
      await db.collection("calls").doc(callId).update({
        roomUrl,
      });

      logger.info("Daily room created:", roomUrl);

      return { roomUrl };
    } catch (err: any) {
      logger.error("Error in createDailyRoom:", err);
      throw new Error(err.message || "Unable to create Daily room");
    }
  }
);
