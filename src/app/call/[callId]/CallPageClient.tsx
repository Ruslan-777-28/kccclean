"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import VideoSDK from "@videosdk.live/js-sdk";
import type { Meeting, Participant } from "@videosdk.live/js-sdk";

export default function CallPageClient() {
  const { callId } = useParams();
  const router = useRouter();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [localParticipant, setLocalParticipant] = useState<Participant | null>(null);
  const [remoteParticipant, setRemoteParticipant] = useState<Participant | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // ---------------------------------------------------------
  // GET TOKEN FROM YOUR BACKEND
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
  // INITIALIZE MEETING
  // ---------------------------------------------------------
  useEffect(() => {
    let meetingInstance: Meeting | null = null;
  
    const init = async () => {
      const token = await fetchToken();
      if (!token || !callId) {
        alert("VideoSDK token or Call ID missing. Cannot join meeting.");
        return;
      }

      // ⭐ NO SECRET HERE — EVER ⭐
      meetingInstance = VideoSDK.initMeeting({
        meetingId: callId as string,
        name: "User",
        micEnabled: true,
        webcamEnabled: true,
        token,
      });

      setMeeting(meetingInstance);

      // ---- Local participant ----
      meetingInstance.on("meeting-joined", () => {
        const lp = meetingInstance?.localParticipant;
        if(lp) {
          setLocalParticipant(lp);

          if (lp?.webcamStream && localVideoRef.current) {
            const mediaStream = new MediaStream();
            mediaStream.addTrack(lp.webcamStream.track);
            localVideoRef.current.srcObject = mediaStream;
            localVideoRef.current.play();
          }
        }
      });

      // ---- Remote participant joins ----
      meetingInstance.on("participant-joined", (participant) => {
        setRemoteParticipant(participant);

        participant.on("stream-enabled", (stream) => {
          if (stream.kind === "video" && remoteVideoRef.current) {
            const mediaStream = new MediaStream();
            mediaStream.addTrack(stream.track);
            remoteVideoRef.current.srcObject = mediaStream;
            remoteVideoRef.current.play();
          }
        });
      });

      // ---- Remote participant leaves ----
      meetingInstance.on("participant-left", () => {
        setRemoteParticipant(null);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
      });
      
      meetingInstance.join();
    };

    init();

    return () => {
      if (meetingInstance) {
        meetingInstance.leave();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callId]);

  const endCall = () => {
    if (meeting) meeting.leave();
    router.push("/");
  };

  // ---------------------------------------------------------
  // RENDER UI
  // ---------------------------------------------------------
  return (
    <div className="flex flex-col items-center justify-center p-6 w-full h-screen bg-black text-white">

      <div className="flex gap-6 w-full max-w-4xl justify-center">

        {/* REMOTE VIDEO */}
        <div className="bg-gray-900 rounded-lg w-[70%] h-[400px] flex items-center justify-center overflow-hidden">
          {remoteParticipant ? (
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          ) : (
            <div className="text-gray-400">Waiting for participant...</div>
          )}
        </div>

        {/* LOCAL VIDEO */}
        <div className="bg-gray-800 rounded-lg w-[25%] h-[180px] overflow-hidden border border-gray-700">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* END CALL */}
      <button
        onClick={endCall}
        className="mt-6 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold"
      >
        End Call
      </button>
    </div>
  );
}
