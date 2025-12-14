"use client";

import { useEffect, useRef } from "react";
import { VideoSDKMeeting } from "@videosdk.live/js-sdk/meeting";

export default function CallPageClient({ meetingId }: { meetingId: string }) {
  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!meetingId) return;

    async function start() {
      // 1. Fetch a signed JWT token
      const res = await fetch("/api/videosdk-token");
      const { token, apiKey } = await res.json();

      if (!token) {
        alert("Token missing");
        return;
      }

      // 2. Create meeting instance
      const meeting = new VideoSDKMeeting({
        meetingId,
        token,
        name: "User",
        micEnabled: true,
        webcamEnabled: true,
      });

      // 3. Event: Meeting Joined
      meeting.on("meeting-joined", () => {
        const localStream = meeting.localParticipant?.streams
          ?.filter((s: any) => s.kind === "video")[0];

        if (localStream && localRef.current) {
          localStream.attach(localRef.current);
        }
      });

      // 4. Event: remote stream added
      meeting.on("stream-enabled", (stream: any) => {
        if (stream.kind === "video" && remoteRef.current) {
          stream.attach(remoteRef.current);
        }
      });

      // 5. Join the room
      meeting.join();
    }

    start();
  }, [meetingId]);

  return (
    <div>
      <h2>Meeting: {meetingId}</h2>
      <video ref={localRef} autoPlay playsInline muted width={400} />
      <video ref={remoteRef} autoPlay playsInline width={400} />
    </div>
  );
}
