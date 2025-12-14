"use client";

import { useEffect, useRef } from "react";
import VideoSDK from "@videosdk.live/js-sdk";

export default function CallPageClient({ meetingId }: { meetingId: string }) {
  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    async function start() {
      if (!meetingId) return;

      // 1. Get token
      const res = await fetch("/api/videosdk-token");
      const { token } = await res.json();

      if (!token) {
        console.error("Token missing");
        return;
      }

      // 2. Init meeting
      const meeting = VideoSDK.initMeeting({
        meetingId,
        apiKey: process.env.NEXT_PUBLIC_VIDEOSDK_API_KEY,
        name: "User",
        micEnabled: true,
        webcamEnabled: true,
      });

      // 3. Join meeting
      meeting.join();

      // 4. Local stream
      meeting.on("meeting-joined", () => {
        const localStream = meeting.localParticipant?.streams?.find(
          (s: any) => s.kind === "video"
        );

        if (localStream && localRef.current) {
          localStream.attach(localRef.current);
        }
      });

      // 5. Remote stream
      meeting.on("stream-enabled", (stream: any) => {
        if (stream.kind === "video" && remoteRef.current) {
          stream.attach(remoteRef.current);
        }
      });
    }

    start();
  }, [meetingId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <video ref={localRef} autoPlay muted playsInline width={300} />
      <video ref={remoteRef} autoPlay playsInline width={300} />
    </div>
  );
}
