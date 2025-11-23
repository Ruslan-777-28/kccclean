"use client";

import { MeetingProvider, useMeeting, useParticipant } from "@videosdk.live/react-sdk";
import { useEffect, useRef } from "react";
import { endCall } from "@/lib/calls";
import { useRouter } from "next/navigation";

interface Props {
  roomId: string;
  token: string;
  callId: string;
}

export default function CallClient({ roomId, token, callId }: Props) {
  return (
    <MeetingProvider
      config={{
        meetingId: roomId,
        name: "User",
        micEnabled: true,
        webcamEnabled: true,
      }}
      token={token}
    >
      <CallUI callId={callId} />
    </MeetingProvider>
  );
}

function CallUI({ callId }: { callId: string }) {
  const meeting = useMeeting();
  const router = useRouter();

  useEffect(() => {
    meeting.join();
  }, []);

  const leave = async () => {
    await endCall(callId);
    meeting.leave();
    router.push("/");
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <div className="flex-1 flex items-center justify-center">
        <ActiveSpeakers />
      </div>

      <div className="p-4 flex justify-center gap-4 bg-gray-900">
        <button
          onClick={meeting.toggleMic}
          className="px-4 py-2 bg-blue-600 rounded"
        >
          Toggle Mic
        </button>

        <button
          onClick={meeting.toggleWebcam}
          className="px-4 py-2 bg-blue-600 rounded"
        >
          Toggle Camera
        </button>

        <button
          onClick={leave}
          className="px-4 py-2 bg-red-600 rounded"
        >
          Leave
        </button>
      </div>
    </div>
  );
}

function ActiveSpeakers() {
  const meeting = useMeeting();
  const participants = [...meeting.participants.values()];

  return (
    <div className="grid grid-cols-2 gap-4 w-full px-4">
      {participants.map((p) => (
        <VideoTile key={p.id} participantId={p.id} />
      ))}
    </div>
  );
}

function VideoTile({ participantId }: { participantId: string }) {
  const { webcamStream, micStream, isLocal } = useParticipant(participantId);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (webcamStream) {
      const mediaStream = new MediaStream([webcamStream.track]);
      const video = videoRef.current;

      if (video) {
        video.srcObject = mediaStream;
        video.play().catch(() => {});
      }
    }
  }, [webcamStream]);

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden relative">
      <video ref={videoRef} autoPlay muted={isLocal} className="w-full h-full object-cover" />
      <div className="absolute bottom-2 left-2 text-xs bg-black/50 px-2 py-1 rounded">
        {participantId}
      </div>
    </div>
  );
}
