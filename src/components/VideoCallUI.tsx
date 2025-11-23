"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMeeting, useParticipant } from "@videosdk.live/react-sdk";
import { useAuth } from "@/context/AuthContext";
import { updateCallStatus } from "@/lib/firestore";
import type { Call } from "@/lib/types";
import { Button } from "./ui/button";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";

interface VideoCallUIProps {
  callId: string;
  call: Call;
}

function ParticipantView({ participantId }: { participantId: string }) {
  const { displayName, webcamStream, micStream, webcamOn, micOn } =
    useParticipant(participantId);

  const videoRef = useRef<HTMLVideoElement>(null);
  const micRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (webcamOn && webcamStream) {
        videoRef.current.srcObject = webcamStream;
        videoRef.current.play().catch((e) => console.error("video_play_error", e));
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [webcamStream, webcamOn]);

  useEffect(() => {
    if (micRef.current) {
      if (micOn && micStream) {
        micRef.current.srcObject = micStream;
        micRef.current.play().catch((e) => console.error("audio_play_error", e));
      } else {
        micRef.current.srcObject = null;
      }
    }
  }, [micStream, micOn]);

  return (
    <div className="relative h-full w-full rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center">
      <audio ref={micRef} autoPlay />
      <video ref={videoRef} className="h-full w-full object-cover" />
       {!webcamOn && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xl">{displayName?.charAt(0)}</p>
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded-md text-sm">
        {displayName}
      </div>
    </div>
  );
}

export function VideoCallUI({ callId, call }: VideoCallUIProps) {
  const router = useRouter();
  const { db } = useAuth();
  const [micOn, setMicOn] = useState(true);
  const [webcamOn, setWebcamOn] = useState(true);

  const {
    localParticipant,
    participants,
    join,
    leave,
    toggleMic,
    toggleWebcam,
  } = useMeeting({
    onMeetingLeft: () => {
      router.replace("/");
    },
    onMeetingJoined: async () => {
        if(db) await updateCallStatus(db, callId, 'in-progress');
    }
  });

  const participantIds = useMemo(() => Array.from(participants.keys()), [participants]);
  const remoteParticipants = participantIds.filter(id => id !== localParticipant?.id);

  const handleEndCall = async () => {
    if (db) {
        await updateCallStatus(db, callId, 'ended');
    }
    leave();
  };

  const handleToggleMic = () => {
    toggleMic();
    setMicOn(prev => !prev);
  }

  const handleToggleWebcam = () => {
    toggleWebcam();
    setWebcamOn(prev => !prev);
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <div className="flex-1 p-2 flex flex-col md:flex-row gap-2">
        <div className="w-full md:w-3/4 h-full relative">
            {remoteParticipants.length > 0 ? (
                <ParticipantView participantId={remoteParticipants[0]} />
            ) : (
                <div className="h-full w-full bg-gray-900 rounded-lg flex items-center justify-center">
                    <p>Waiting for the other participant to join...</p>
                </div>
            )}
        </div>
        <div className="w-full md:w-1/4 h-1/3 md:h-1/4">
            {localParticipant && <ParticipantView participantId={localParticipant.id} />}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 py-4 border-t border-gray-700">
        <Button
          onClick={handleToggleMic}
          variant="outline"
          size="icon"
          className={`rounded-full h-12 w-12 ${micOn ? 'bg-gray-700' : 'bg-red-600'}`}
        >
          {micOn ? <Mic /> : <MicOff />}
        </Button>
        <Button
          onClick={handleToggleWebcam}
          variant="outline"
          size="icon"
          className={`rounded-full h-12 w-12 ${webcamOn ? 'bg-gray-700' : 'bg-red-600'}`}
        >
          {webcamOn ? <Video /> : <VideoOff />}
        </Button>
        <Button
          onClick={handleEndCall}
          variant="destructive"
          size="icon"
          className="rounded-full h-12 w-12"
        >
          <PhoneOff />
        </Button>
      </div>
    </div>
  );
}
