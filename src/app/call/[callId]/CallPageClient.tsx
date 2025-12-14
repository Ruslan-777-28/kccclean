"use client";

import { useEffect, useRef } from "react";
import VideoSDK from "@videosdk.live/js-sdk";

export default function CallPageClient({ meetingId }: { meetingId: string }) {
  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!meetingId) return;

    async function startMeeting() {
      // 1. Fetch token
      const res = await fetch("/api/videosdk-token");
      const { token } = await res.json();

      if (!token) {
        console.error("Token missing");
        return;
      }

      // 2. Load SDK
      await VideoSDK.config({ token });

      // 3. Create meeting
      const meeting = VideoSDK.initMeeting({
        meetingId,
        name: "User",
        micEnabled: true,
        webcamEnabled: true,
      });

      // 4. Join room
      meeting.join();

      // 5. Local video stream
      meeting.on("meeting-joined", () => {
        const stream = meeting.localParticipant?.streams?.find(
          (s: any) => s.kind === "video"
        );

        if (stream && localRef.current) {
          stream.attach(localRef.current);
        }
      });

      // 6. Remote participant video
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

    startMeeting();
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
