"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CallPageClient() {
  const { callId } = useParams();
  const router = useRouter();

  const [meeting, setMeeting] = useState<any>(null);
  const [VideoSDK, setVideoSDK] = useState<any>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // ---------------------------------------------------------
  // LOAD SDK DYNAMICALLY (THE ONLY CORRECT WAY FOR NEXT.JS)
  // ---------------------------------------------------------
  useEffect(() => {
    const loadSDK = async () => {
      const sdk = (await import("@videosdk.live/js-sdk")).default;
      setVideoSDK(sdk);
    };
    loadSDK();
  }, []);

  // ---------------------------------------------------------
  // GET TOKEN FROM BACKEND
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // INIT MEETING ONCE SDK IS LOADED
  // ---------------------------------------------------------
  useEffect(() => {
    if (!VideoSDK || !callId) return; // wait for dynamic load

    let meetingInstance: any = null;

    const init = async () => {
      const token = await fetchToken();
      if (!token) {
        alert("Missing VideoSDK token.");
        return;
      }

      meetingInstance = VideoSDK.initMeeting({
        meetingId: callId,
        name: "User",
        micEnabled: true,
        webcamEnabled: true,
        token,
      });

      setMeeting(meetingInstance);

      // LOCAL
      meetingInstance.on("meeting-joined", () => {
        const lp = meetingInstance.localParticipant;

        if (lp.webcamStream && localVideoRef.current) {
          const stream = new MediaStream([lp.webcamStream.track]);
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play();
        }
      });

      // REMOTE
      meetingInstance.on("participant-joined", (participant: any) => {
        participant.on("stream-enabled", (stream: any) => {
          if (stream.kind === "video" && remoteVideoRef.current) {
            const ms = new MediaStream([stream.track]);
            remoteVideoRef.current.srcObject = ms;
            remoteVideoRef.current.play();
          }
        });
      });
      
      meetingInstance.on("participant-left", () => {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [VideoSDK, callId]);
  
  const handleEndCall = () => {
    if(meeting) {
        meeting.leave();
    }
    router.push('/');
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-black text-white p-8">
      <div className="flex gap-6 w-full max-w-4xl">
        <div className="w-[70%] h-[400px] bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        </div>
        <div className="w-[25%] h-[180px] bg-gray-800 rounded-lg overflow-hidden">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
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
