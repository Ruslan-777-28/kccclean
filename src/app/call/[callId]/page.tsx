"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MeetingProvider,
  useMeeting,
  useParticipant,
} from "@videosdk.live/react-sdk";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { fetchVideoSDKToken } from "@/lib/videosdk";
import LoadingScreen from "@/components/LoadingScreen";
import { endCall } from "@/lib/calls";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2 } from "lucide-react";
import type { Call } from "@/lib/types";

// --- Sub-components ---

interface ParticipantViewProps {
  participantId: string;
}

function ParticipantView({ participantId }: ParticipantViewProps) {
  const { webcamStream, webcamOn, displayName } = useParticipant(participantId);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (webcamOn && webcamStream) {
        const mediaStream = new MediaStream();
        mediaStream.addTrack(webcamStream.track);
        videoRef.current.srcObject = mediaStream;
        videoRef.current
          .play()
          .catch((e) => console.error("video_play_error", e));
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [webcamStream, webcamOn]);

  return (
    <div className="relative h-full w-full rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        autoPlay
        playsInline
        muted
      />
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

function CallUIView({ callId, roomId }: { callId: string, roomId: string }) {
  const router = useRouter();
  const {
    localParticipant,
    participants,
    leave,
    toggleMic,
    toggleWebcam,
    join,
    micOn,
    webcamOn,
  } = useMeeting({
    onMeetingLeft: () => {
      router.replace("/");
    },
  });

  useEffect(() => {
    join();
  }, [join]);

  const participantIds = Array.from(participants.keys());
  const remoteParticipants = participantIds.filter(
    (id) => id !== localParticipant?.id
  );

  const handleEndCall = async () => {
    await endCall(callId);
    leave();
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <div className="flex-1 p-2 flex flex-col md:flex-row gap-2">
        <div className="w-full md:w-3/4 lg:w-4/5 h-full relative">
          {remoteParticipants.length > 0 ? (
            <ParticipantView participantId={remoteParticipants[0]} />
          ) : (
            <div className="h-full w-full bg-gray-900 rounded-lg flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
              <p className="text-gray-400">
                Waiting for the other participant to join...
              </p>
            </div>
          )}
        </div>
        <div className="w-full md:w-1/4 lg:w-1/5 h-1/3 md:h-full flex flex-col gap-2">
          <div className="bg-gray-800 p-2 rounded-lg text-center">
            <p className="text-sm font-semibold">Call ID:</p>
            <p className="text-xs text-gray-400 truncate">{roomId}</p>
          </div>
          <div className="flex-grow min-h-[150px]">
            {localParticipant && (
              <ParticipantView participantId={localParticipant.id} />
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 py-4 border-t border-gray-700 bg-black">
        <Button
          onClick={() => toggleMic()}
          variant="outline"
          size="icon"
          className={`rounded-full h-14 w-14 transition-colors ${
            micOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {micOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
        </Button>
        <Button
          onClick={() => toggleWebcam()}
          variant="outline"
          size="icon"
          className={`rounded-full h-14 w-14 transition-colors ${
            webcamOn
              ? "bg-gray-700 hover:bg-gray-600"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {webcamOn ? (
            <Video className="h-6 w-6" />
          ) : (
            <VideoOff className="h-6 w-6" />
          )}
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


// --- Main Page Component ---
export default function CallPage() {
  const { callId: callIdParam } = useParams();
  const callId = callIdParam as string;
  const { db } = useAuth();

  const [callData, setCallData] = useState<Call | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !callId) return;

    // Fetch token first
    fetchVideoSDKToken()
      .then(setToken)
      .catch((err) => {
        console.error("Failed to get VideoSDK token", err);
        setError("Could not get a valid token for the call.");
      });

    // Subscribe to call document for real-time updates (roomId)
    const unsub = onSnapshot(
      doc(db, "calls", callId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Call;
          setCallData(data);
          if(data.roomId) {
            setLoading(false);
          }
          if(data.status === 'declined' || data.status === 'ended') {
            setError("This call has ended.");
            setLoading(false);
          }
        } else {
          setError("This call does not exist.");
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error listening to call document:", err);
        setError("Failed to connect to call data.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [db, callId]);

  const roomId = callData?.roomId;

  if (loading) {
    return <LoadingScreen message="Connecting to call..." />;
  }

  if (error) {
    return <LoadingScreen message={`Error: ${error}`} />;
  }
  
  if (!roomId || !token) {
    return <LoadingScreen message="Waiting for user to accept the call..." />;
  }

  return (
    <MeetingProvider
      token={token}
      config={{
        meetingId: roomId,
        name: "User", // This can be replaced with the actual user's name
        micEnabled: true,
        webcamEnabled: true,
      }}
    >
      <CallUIView callId={callId} roomId={roomId} />
    </MeetingProvider>
  );
}
