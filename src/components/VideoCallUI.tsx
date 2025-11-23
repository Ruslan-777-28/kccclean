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
        const mediaStream = new MediaStream();
        // @ts-ignore
        mediaStream.addTrack(webcamStream.track);
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch((e) => console.error("video_play_error", e));
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [webcamStream, webcamOn]);

  useEffect(() => {
    if (micRef.current) {
      if (micOn && micStream) {
        const mediaStream = new MediaStream();
        // @ts-ignore
        mediaStream.addTrack(micStream.track);
        micRef.current.srcObject = mediaStream;
        micRef.current.play().catch((e) => console.error("audio_play_error", e));
      } else {
        micRef.current.srcObject = null;
      }
    }
  }, [micStream, micOn]);

  return (
    <div className="relative h-full w-full rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center">
      <audio ref={micRef} autoPlay muted={false} />
      <video ref={videoRef} className="h-full w-full object-cover" autoPlay playsInline muted />
       {!webcamOn && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
           <div className="h-24 w-24 bg-gray-700 rounded-full flex items-center justify-center text-3xl">
            {displayName?.charAt(0)}
           </div>
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
        {/* Remote Participant View */}
        <div className="w-full md:w-3/4 lg:w-4/5 h-full relative">
            {remoteParticipants.length > 0 ? (
                <ParticipantView participantId={remoteParticipants[0]} />
            ) : (
                <div className="h-full w-full bg-gray-900 rounded-lg flex flex-col items-center justify-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
                    <p className="text-gray-400">Waiting for the other participant to join...</p>
                </div>
            )}
        </div>
        {/* Local Participant View */}
        <div className="w-full md:w-1/4 lg:w-1/5 h-1/3 md:h-full flex flex-col gap-2">
           <div className="bg-gray-800 p-2 rounded-lg text-center">
              <p className="text-sm font-semibold">Call ID:</p>
              <p className="text-xs text-gray-400 truncate">{call.roomId}</p>
            </div>
            <div className="flex-grow min-h-[150px]">
              {localParticipant && <ParticipantView participantId={localParticipant.id} />}
            </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-4 border-t border-gray-700 bg-black">
        <Button
          onClick={handleToggleMic}
          variant="outline"
          size="icon"
          className={`rounded-full h-14 w-14 transition-colors ${micOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
        >
          {micOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
        </Button>
        <Button
          onClick={handleToggleWebcam}
          variant="outline"
          size="icon"
          className={`rounded-full h-14 w-14 transition-colors ${webcamOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
        >
          {webcamOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
        </Button>
        <Button
          onClick={handleEndCall}
          variant="destructive"
          size="icon"
          className="rounded-full h-14 w-14"
        >
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
