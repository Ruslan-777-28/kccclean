"use client";

import { useEffect, useRef } from "react";
import VideoSDK from "@videosdk.live/js-sdk";

export default function CallPageClient({ meetingId }: { meetingId: string }) {
  const localRef = useRef(null);
  const remoteRef = useRef(null);

  useEffect(() => {
    async function start() {
      if (!meetingId) return;
      const tokenRes = await fetch("/api/videosdk-token");
      const { token } = await tokenRes.json();

      if (!token) {
        alert("Failed to get token");
        return;
      }

      const meeting = VideoSDK.initMeeting({
        meetingId,
        name: "User",
        apiKey: process.env.NEXT_PUBLIC_VIDEOSDK_API_KEY,
        containerId: null,
        micEnabled: true,
        webcamEnabled: true,
      });

      meeting.join();

      meeting.on("stream-enabled", (stream: any) => {
        if (stream.kind === "video" && stream.participantId !== meeting.localParticipant.id) {
          stream.attach(remoteRef.current);
        }
      });

      meeting.on("meeting-joined", () => {
        const localStream = meeting.localParticipant?.streams?.find((s: any) => s.kind === "video");
        if (localStream) {
          localStream.attach(localRef.current);
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
