"use client";

import { useEffect, useRef, useState } from "react";
import type { Meeting } from "@videosdk.live/js-sdk";
import { useParams } from "next/navigation";
import { endCall } from "@/lib/calls";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Video, VideoOff, PhoneOff, ScreenShare, ScreenShareOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CallPageClientProps {
  token: string;
  meetingId: string;
}

export default function CallPageClient({ token, meetingId }: CallPageClientProps) {
  const router = useRouter();
  const { callId: firestoreCallId } = useParams(); // This is the ID from Firestore
  
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [localParticipant, setLocalParticipant] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isWebcamOn, setIsWebcamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  useEffect(() => {
    let sdk: any;
    let m: Meeting;

    async function initMeeting() {
      try {
        // Dynamically import the SDK
        sdk = (await import("@videosdk.live/js-sdk")).default;
        
        m = sdk.initMeeting({
          meetingId,
          name: "User",
          micEnabled: true,
          webcamEnabled: true,
          token: token,
        });

        setMeeting(m);

        // --- Event Listeners ---
        m.on("meeting-joined", () => {
          console.log("Meeting Joined!");
          setLocalParticipant(m.localParticipant);
          const remoteParticipants = [...m.participants.values()];
          setParticipants(remoteParticipants);
        });

        m.on("participant-joined", (participant: any) => {
          console.log("Participant Joined:", participant.id);
          setParticipants(prev => [...prev, participant]);
        });

        m.on("participant-left", (participant: any) => {
          console.log("Participant Left:", participant.id);
          setParticipants(prev => prev.filter(p => p.id !== participant.id));
          if(remoteVideoRef.current?.srcObject){
             const stream = remoteVideoRef.current.srcObject as MediaStream;
             if(stream.getTracks().length === 0){
                remoteVideoRef.current.srcObject = null;
             }
          }
        });
        
        m.on("stream-enabled", (stream: any) => {
           if (stream.participantId === m.localParticipant.id) {
             if (stream.kind === 'video' && localVideoRef.current) {
                const mediaStream = new MediaStream([stream.track]);
                localVideoRef.current.srcObject = mediaStream;
                localVideoRef.current.play().catch(console.error);
             }
           } else {
             if (stream.kind === 'video' && remoteVideoRef.current) {
                const mediaStream = new MediaStream([stream.track]);
                remoteVideoRef.current.srcObject = mediaStream;
                remoteVideoRef.current.play().catch(console.error);
             }
           }
        });
        
        m.on("stream-disabled", (stream: any) => {
           if (stream.participantId !== m.localParticipant.id) {
             if (stream.kind === 'video' && remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = null;
             }
           }
        });

         m.on("meeting-left", () => {
          console.log("Meeting left");
          router.push('/');
        });

        // Join the meeting
        m.join();

      } catch (error) {
        console.error("Failed to initialize or join meeting:", error);
        alert("Error: Could not initialize meeting.");
      }
    }

    initMeeting();

    return () => {
      // Cleanup on unmount
      if (m) {
        m.leave();
      }
    };
  }, [meetingId, token, router]);

  const handleLeave = async () => {
    if (meeting) {
      meeting.leave();
    }
    if (typeof firestoreCallId === 'string') {
        await endCall(firestoreCallId);
    }
    router.push('/');
  };

  const toggleMic = () => {
    if (meeting) {
      if (isMicOn) meeting.muteMic();
      else meeting.unmuteMic();
      setIsMicOn(!isMicOn);
    }
  };

  const toggleWebcam = () => {
    if (meeting) {
      if (isWebcamOn) meeting.disableWebcam();
      else meeting.enableWebcam();
      setIsWebcamOn(!isWebcamOn);
    }
  };

   const toggleScreenShare = async () => {
    if (meeting) {
      if (isScreenSharing) {
        meeting.disableScreenShare();
      } else {
        await meeting.enableScreenShare();
      }
      setIsScreenSharing(!isScreenSharing);
    }
  };


  const remoteParticipant = participants.length > 0 ? participants[0] : null;

  return (
    <div className="flex flex-col items-center justify-between p-4 bg-black min-h-screen text-white">
      
      <div className="w-full text-center">
        <h1 className="text-2xl font-bold mb-2">Video Call</h1>
        <p className="text-sm text-gray-400">Meeting ID: {meetingId}</p>
      </div>
      
      <div className="relative flex-grow w-full max-w-5xl flex items-center justify-center my-4">
        {remoteParticipant ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain rounded-lg"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-lg">
            <p className="text-gray-400">Waiting for other participant...</p>
          </div>
        )}
         <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg shadow-lg border-2 border-gray-600"
          />
      </div>

      <div className="flex items-center justify-center gap-4 p-4 bg-gray-900/50 rounded-full">
         <Button onClick={toggleMic} variant={isMicOn ? "secondary" : "destructive"} size="icon" className="rounded-full w-14 h-14">
          {isMicOn ? <Mic /> : <MicOff />}
        </Button>
        <Button onClick={toggleWebcam} variant={isWebcamOn ? "secondary" : "destructive"} size="icon" className="rounded-full w-14 h-14">
          {isWebcamOn ? <Video /> : <VideoOff />}
        </Button>
         <Button onClick={toggleScreenShare} variant={isScreenSharing ? "secondary" : "default"} size="icon" className="rounded-full w-14 h-14">
          {isScreenSharing ? <ScreenShareOff /> : <ScreenShare />}
        </Button>
        <Button onClick={handleLeave} variant="destructive" size="icon" className="rounded-full w-16 h-16">
          <PhoneOff />
        </Button>
      </div>
    </div>
  );
}
