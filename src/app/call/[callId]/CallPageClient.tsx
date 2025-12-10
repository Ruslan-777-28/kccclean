"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import type { Meeting } from "@videosdk.live/js-sdk";

export default function CallPageClient() {
  const { callId } = useParams();
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);

  const [VideoSDK, setVideoSDK] = useState<any>(null);
  const [meeting, setMeeting] = useState<Meeting | null>(null);

  // 1. ДИНАМІЧНО завантажуємо SDK (інакше Next.js ламається)
  useEffect(() => {
    (async () => {
      // Use .default for CommonJS modules compatibility
      const sdk = (await import("@videosdk.live/js-sdk")).default;
      setVideoSDK(sdk);
    })();
  }, []);

  // 2. Отримуємо токен
  const fetchToken = async () => {
    try {
      const res = await fetch("/api/videosdk-token");
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Token fetch failed: ${res.status} ${errorText}`);
      }
      const data = await res.json();
      if(!data.token) {
        throw new Error("Token not found in API response");
      }
      return data.token;
    } catch (e) {
      console.error("Token error:", e);
      return null;
    }
  };

  // 3. Ініціалізуємо Meeting коли SDK готовий
  useEffect(() => {
    if (!VideoSDK || !callId) return;

    let m: Meeting | null = null;

    (async () => {
      const token = await fetchToken();
      if (!token) {
        alert("Error: Could not get VideoSDK token");
        return;
      }

      m = VideoSDK.initMeeting({
        meetingId: Array.isArray(callId) ? callId[0] : callId,
        name: "User",
        micEnabled: true,
        webcamEnabled: true,
        token,
      });

      if (!m) {
        console.error("Failed to initialize meeting");
        return;
      }

      setMeeting(m);

      // LOCAL STREAM
      m.on("meeting-joined", () => {
        console.log("Meeting Joined!");
        const lp = m?.localParticipant;
        if (lp && lp.webcamStream && localRef.current) {
          const ms = new MediaStream([lp.webcamStream.track]);
          localRef.current.srcObject = ms;
          localRef.current.play().catch(console.error);
        }
      });

      // REMOTE STREAM
      m.on("participant-joined", (p: any) => {
        console.log("Participant Joined:", p.id);
        p.on("stream-enabled", (stream: any) => {
          if (stream.kind === "video" && remoteRef.current) {
            console.log("Remote video stream enabled");
            const ms = new MediaStream([stream.track]);
            remoteRef.current.srcObject = ms;
            remoteRef.current.play().catch(console.error);
          }
        });

         p.on("stream-disabled", (stream: any) => {
          if (stream.kind === "video" && remoteRef.current) {
            console.log("Remote video stream disabled");
            remoteRef.current.srcObject = null;
          }
        });
      });

       m.on("participant-left", (p: any) => {
        console.log("Participant Left:", p.id);
        if(remoteRef.current) {
            remoteRef.current.srcObject = null;
        }
      });

      m.join();
    })();

    return () => {
      m?.leave();
      console.log("Meeting left on component unmount.");
    };
  }, [VideoSDK, callId]);

  return (
    <div className="flex flex-col p-6 gap-4 text-center text-white bg-black min-h-screen">
      <h1 className="text-xl font-bold">Video Meeting: {callId}</h1>

      <div className="flex flex-wrap gap-4 justify-center items-start">
        <div className="flex-grow w-full md:w-auto md:flex-grow-[3] aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <video ref={remoteRef} autoPlay playsInline className="w-full h-full object-cover" />
        </div>
        <div className="w-1/2 md:w-1/4 aspect-video bg-gray-700 rounded-lg overflow-hidden">
            <video ref={localRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
}