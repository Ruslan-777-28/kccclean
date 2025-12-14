"use client";

import { useEffect, useRef } from "react";

export default function CallPageClient({ meetingId }: { meetingId: string }) {
  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    async function startMeeting() {
      if (!meetingId) return;

      const VideoSDK = (window as any).VideoSDK;
      if (!VideoSDK) {
        console.error("VideoSDK failed to load");
        return;
      }

      // Fetch token
      const res = await fetch("/api/videosdk-token");
      const { token } = await res.json();

      if (!token) {
        console.error("Token missing");
        return;
      }

      // Config
      await VideoSDK.config({ token });

      // Create meeting
      const meeting = VideoSDK.initMeeting({
        meetingId,
        name: "User",
        micEnabled: true,
        webcamEnabled: true,
      });

      meeting.join();

      meeting.on("meeting-joined", () => {
        const stream = meeting.localParticipant?.streams?.find(
          (s: any) => s.kind === "video"
        );
        if (stream && localRef.current) {
          stream.attach(localRef.current);
        }
      });

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
