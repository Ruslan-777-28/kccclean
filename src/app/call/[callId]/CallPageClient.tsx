"use client";

import { useEffect, useRef } from "react";
import VideoSDK from "@videosdk.live/js-sdk";

export default function CallPageClient({ meetingId }: { meetingId: string }) {
  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!meetingId) return;

    async function start() {
      // 1. Check if SDK is loaded
      if (!VideoSDK) {
        console.error("VideoSDK failed to load");
        return;
      }
      
      // 2. Отримуємо токен
      const res = await fetch("/api/videosdk-token");
      const { token } = await res.json();

      if (!token) {
        console.error("Token missing");
        return;
      }

      // 3. Конфіг SDK
      await VideoSDK.config({ token });

      // 4. Ініціалізація зустрічі
      const meeting = VideoSDK.initMeeting({
        meetingId,
        name: "User",
        micEnabled: true,
        webcamEnabled: true,
      });

      meeting.join();

      // 5. Локальний стрім
      meeting.on("meeting-joined", () => {
        const stream = meeting.localParticipant?.streams?.find(
          (s: any) => s.kind === "video"
        );
        if (stream && localRef.current) {
          stream.attach(localRef.current);
        }
      });

      // 6. Ремот стрім
      meeting.on("stream-enabled", (stream: any) => {
        if (
          stream.kind === "video" &&
          stream.participantId !== meeting.localParticipant.id &&
          remoteRef.current
        ) {
          stream.attach(remoteRef.current);
        }
      });
    }

    start();
  }, [meetingId]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Meeting: {meetingId}</h2>
      <div style={{ display: "flex", gap: 20 }}>
        <video ref={localRef} autoPlay muted playsInline width={400} />
        <video ref={remoteRef} autoPlay playsInline width={400} />
      </div>
    </div>
  );
}
