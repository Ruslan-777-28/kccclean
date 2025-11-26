"use client";

import { useEffect, useRef } from "react";
import {
  useMeeting,
  useParticipant,
} from "@videosdk.live/react-sdk";
import { endCall } from "@/lib/calls";
import { Button } from "@/components/ui/button";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

// ----------------------------
//   PARTICIPANT VIEW
// ----------------------------
export function ParticipantView({ participantId }: { participantId: string }) {
  const { webcamStream, webcamOn, displayName } = useParticipant(participantId);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    if (webcamOn && webcamStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(webcamStream.track);
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch((e) => console.error("video play error", e));
    } else {
      videoRef.current.srcObject = null;
    }
  }, [webcamStream, webcamOn]);

  return (
    <div className="relative h-full w-full rounded-lg overflow-hidden bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        autoPlay
        playsInline
        muted
      />
      {!webcamOn && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="h-20 w-20 bg-gray-700 rounded-full flex items-center justify-center text-2xl text-white">
            {displayName?.charAt(0)}
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded-md text-sm">
        {displayName}
      </div>
    </div>
  );
}

// ----------------------------
//          UI LAYOUT
// ----------------------------
export default function CallUIView({
  callId,
  roomId,
}: {
  callId: string;
  roomId: string;
}) {
  const router = useRouter();

  const {
    localParticipant,
    participants,
    leave,
    toggleMic,
    toggleWebcam,
    micOn,
    webcamOn,
    join,
  } = useMeeting({
    onMeetingLeft: () => {
      router.replace("/");
    },
  });

  useEffect(() => {
    join();
  }, []);

  const participantIds = Array.from(participants.keys());
  const remoteParticipants = participantIds.filter(
    (id) => id !== localParticipant?.id
  );

  // ----------------------------
  //   FIXED END CALL
  // ----------------------------
  const handleEndCall = async () => {
    try {
      await endCall(callId);

      // Guarantee stop camera stream
      if (localParticipant?.webcamStream?.track) {
        localParticipant.webcamStream.track.stop();
      }

      // Guarantee stop mic stream
      if (localParticipant?.micStream?.track) {
        localParticipant.micStream.track.stop();
      }

      leave();
    } catch (err) {
      console.error("End call failed:", err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white">

      {/* MAIN AREA */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl aspect-video grid grid-cols-2 gap-4">
            {/* Remote video */}
            <div className="w-full h-full rounded-lg overflow-hidden">
              {remoteParticipants.length > 0 ? (
                <ParticipantView participantId={remoteParticipants[0]} />
              ) : (
                <div className="h-full w-full bg-gray-900 rounded-lg flex flex-col items-center justify-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
                  <p className="text-gray-400">Waiting for participant...</p>
                </div>
              )}
            </div>

            {/* Local video */}
            <div className="w-full h-full rounded-lg overflow-hidden">
             {localParticipant && (
                <ParticipantView participantId={localParticipant.id} />
            )}
            </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="flex items-center justify-center gap-6 py-4 border-t border-gray-700 bg-black">
        
        {/* MIC */}
        <Button
          onClick={() => toggleMic()}
          variant="outline"
          size="icon"
          className={`rounded-full h-14 w-14 ${
            micOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {micOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
        </Button>

        {/* CAMERA */}
        <Button
          onClick={() => toggleWebcam()}
          variant="outline"
          size="icon"
          className={`rounded-full h-14 w-14 ${
            webcamOn
              ? "bg-gray-700 hover:bg-gray-600"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {webcamOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
        </Button>

        {/* END CALL */}
        <Button
          onClick={handleEndCall}
          variant="destructive"
          size="icon"
          className="rounded-full h-14 w-14 bg-red-700 hover:bg-red-800"
        >
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>

    </div>
  );
}
