"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CallPageClient() {
  const { callId } = useParams();
  const router = useRouter();

  const [VideoSDK, setVideoSDK] = useState<any>(null);
  const [meeting, setMeeting] = useState<any>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // -------------------------------------------------------
  // 1) LOAD VIDEOSDK DYNAMICALLY (CORRECT FOR NEXT.JS)
  // -------------------------------------------------------
  useEffect(() => {
    const loadSDK = async () => {
      try {
        console.log("Loading VideoSDK...");
        const { VideoSDK } = await import("@videosdk.live/js-sdk");
        console.log("VideoSDK loaded:", VideoSDK);
        setVideoSDK(VideoSDK);
      } catch (err) {
        console.error("❌ FAILED to load VideoSDK:", err);
      }
    };

    loadSDK();
  }, []);

  // -------------------------------------------------------
  // 2) FETCH TOKEN FROM BACKEND
  // -------------------------------------------------------
  const fetchToken = async () => {
    try {
      const res = await fetch("/api/videosdk-token");
      const data = await res.json();
      return data.token;
    } catch (err) {
      console.error("❌ Failed to fetch VideoSDK Token:", err);
      return null;
    }
  };

  // -------------------------------------------------------
  // 3) INIT MEETING ONCE SDK LOADED
  // -------------------------------------------------------
  useEffect(() => {
    if (!VideoSDK || !callId) return;

    let meetingInstance: any = null;

    const init = async () => {
      console.log("SDK ready → initializing meeting…");

      const token = await fetchToken();
      if (!token) {
        alert("❌ Missing VideoSDK token");
        return;
      }

      meetingInstance = VideoSDK.initMeeting({
        meetingId: callId,
        name: "User",
        micEnabled: true,
        webcamEnabled: true,
        token,
      });

      console.log("Meeting instance created:", meetingInstance);

      setMeeting(meetingInstance);

      // LOCAL VIDEO → when meeting joined
      meetingInstance.on("meeting-joined", () => {
        console.log("✔ Meeting joined");

        const lp = meetingInstance.localParticipant;

        if (lp.webcamStream && localVideoRef.current) {
          const stream = new MediaStream([lp.webcamStream.track]);
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
        }
      });

      // REMOTE VIDEO → when another participant enables stream
      meetingInstance.on("participant-joined", (participant: any) => {
        console.log("Participant joined:", participant.id);

        participant.on("stream-enabled", (stream: any) => {
          console.log("Remote stream enabled:", stream.kind);

          if (stream.kind === "video" && remoteVideoRef.current) {
            const mediaStream = new MediaStream([stream.track]);
            remoteVideoRef.current.srcObject = mediaStream;
            remoteVideoRef.current.play().catch(() => {});
          }
        });
      });

      meetingInstance.on("participant-left", () => {
        console.log("Participant left");
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
      });

      meetingInstance.join();
    };

    init();

    return () => {
      meetingInstance?.leave();
    };
  }, [VideoSDK, callId]);

  // -------------------------------------------------------
  // END CALL
  // -------------------------------------------------------
  const handleEndCall = () => {
    meeting?.leave();
    router.push("/");
  };

  // -------------------------------------------------------
  // UI
  // -------------------------------------------------------
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-screen bg-black text-white p-8">
      <div className="flex gap-6 w-full max-w-4xl">
        {/* REMOTE VIDEO */}
        <div className="w-[70%] h-[400px] bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        </div>

        {/* LOCAL VIDEO */}
        <div className="w-[25%] h-[180px] bg-gray-800 rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <button
        onClick={handleEndCall}
        className="mt-6 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold"
      >
        End Call
      </button>
    </div>
  );
}
