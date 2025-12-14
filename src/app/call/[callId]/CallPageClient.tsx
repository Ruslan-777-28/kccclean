"use client";

import { useEffect, useRef } from "react";

let VideoSDK: any = null;

/** Завантаження SDK лише в браузері */
async function loadSDK() {
  if (typeof window !== "undefined" && !VideoSDK) {
    const mod = await import("@videosdk.live/js-sdk");
    VideoSDK = mod.default;
    console.log("VideoSDK loaded:", VideoSDK);
  }
}

export default function CallPageClient({ meetingId }: { meetingId: string }) {
  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!meetingId) return;

    async function start() {
      /** 1. Load SDK */
      await loadSDK();

      if (!VideoSDK) {
        console.error("SDK failed to load");
        return;
      }

      console.log("SDK OK — starting meeting...");

      /** 2. Fetch token */
      const res = await fetch("/api/videosdk-token");
      const { token } = await res.json();

      if (!token) {
        console.error("Token missing");
        return;
      }

      /** 3. Configure SDK */
      await VideoSDK.config({ token });

      /** 4. Init meeting */
      const meeting = VideoSDK.initMeeting({
        meetingId,
        name: "User",
        micEnabled: true,
        webcamEnabled: true,
      });

      /** 5. Join meeting */
      meeting.join();

      /** 6. Local video */
      meeting.on("meeting-joined", () => {
        const stream = meeting.localParticipant?.streams?.find(
          (s: any) => s.kind === "video"
        );

        if (stream && localRef.current) {
          stream.attach(localRef.current);
        }
      });

      /** 7. Remote video */
      meeting.on("stream-enabled", (stream: any) => {
        if (
          stream.kind === "video" &&
          remoteRef.current &&
          stream.participantId !== meeting.localParticipant.id
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
