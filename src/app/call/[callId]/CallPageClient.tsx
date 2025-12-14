"use client";

import { useEffect, useRef } from "react";

export default function CallPageClient({ meetingId }: { meetingId: string }) {
  const localRef = useRef(null);
  const remoteRef = useRef(null);

  useEffect(() => {
    if (!meetingId) return;

    async function start() {
      // @ts-ignore
      const VideoSDK = window.VideoSDK;

      if (!VideoSDK) {
        console.error("VideoSDK not loaded from CDN");
        return;
      }

      const res = await fetch("/api/videosdk-token");
      const { token } = await res.json();
      
      if (!token) {
        console.error("Token missing");
        return;
      }

      await VideoSDK.config({ token });

      const meeting = VideoSDK.initMeeting({
        meetingId,
        name: "User",
        micEnabled: true,
        webcamEnabled: true,
      });

      meeting.join();

      meeting.on("meeting-joined", () => {
        const stream = meeting.localParticipant.streams.find((s:any) => s.kind === "video");
        if (stream && localRef.current) stream.attach(localRef.current);
      });

      meeting.on("stream-enabled", (stream: any) => {
        if (stream.kind === "video" && stream.participantId !== meeting.localParticipant.id) {
          if (remoteRef.current) stream.attach(remoteRef.current);
        }
      });
    }

    start();
  }, [meetingId]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Meeting: {meetingId}</h2>
      <video ref={localRef} autoPlay muted width={320} />
      <video ref={remoteRef} autoPlay width={320} />
    </div>
  );
}
