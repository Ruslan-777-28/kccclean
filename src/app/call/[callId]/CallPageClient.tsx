
"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

let VideoSDK: any = null;

async function loadSDK() {
  if (typeof window !== "undefined" && !VideoSDK) {
    try {
      const mod = await import("@videosdk.live/js-sdk");
      VideoSDK = mod.default;
      console.log("VideoSDK loaded successfully.");
    } catch (error) {
      console.error("Failed to load VideoSDK:", error);
    }
  }
}

export default function CallPageClient({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);
  const [meeting, setMeeting] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!meetingId) {
      setError("Meeting ID is missing.");
      setLoading(false);
      return;
    }

    async function startMeeting() {
      setLoading(true);
      await loadSDK();

      if (!VideoSDK) {
        setError("Video SDK failed to load. Please check the console for errors.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/videosdk-token");
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch token");
        }
        const { token } = await res.json();

        if (!token) {
          throw new Error("VideoSDK token is missing.");
        }

        await VideoSDK.config({ token });

        const newMeeting = VideoSDK.initMeeting({
          meetingId,
          name: "User", // This can be dynamic based on authenticated user
          micEnabled: true,
          webcamEnabled: true,
        });

        newMeeting.join();

        newMeeting.on("meeting-joined", () => {
          setLoading(false);
          const localStream = newMeeting.localParticipant?.streams?.find(
            (s: any) => s.kind === "video"
          );
          if (localStream && localRef.current) {
            localStream.attach(localRef.current);
          }
        });

        newMeeting.on("meeting-left", () => {
          setMeeting(null);
          router.push('/');
        });
        
        newMeeting.on("stream-enabled", (stream: any) => {
          if (
            stream.kind === "video" &&
            remoteRef.current &&
            stream.participantId !== newMeeting.localParticipant.id
          ) {
            const remoteStream = new MediaStream();
            remoteStream.addTrack(stream.track);
            remoteRef.current.srcObject = remoteStream;
          }
        });
        
        newMeeting.on("stream-disabled", (stream: any) => {
            if (stream.kind === 'video' && remoteRef.current && stream.participantId !== newMeeting.localParticipant.id) {
                remoteRef.current.srcObject = null;
            }
        });

        newMeeting.on('participant-left', () => {
            if (remoteRef.current) {
                remoteRef.current.srcObject = null;
            }
        });

        setMeeting(newMeeting);
      } catch (err: any) {
        console.error("Error starting meeting:", err);
        setError(err.message);
        setLoading(false);
      }
    }

    startMeeting();

    return () => {
      meeting?.leave();
    };
  }, [meetingId, router]);

  const handleEndCall = () => {
    meeting?.leave();
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Connecting to the call...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-bold text-destructive">Connection Failed</h2>
        <p className="text-destructive/80">{error}</p>
        <Button onClick={() => router.push('/')}>Go to Homepage</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-4">Meeting Room</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
            <h2 className="font-bold mb-2">You</h2>
            <video ref={localRef} autoPlay muted playsInline className="w-full bg-black rounded-lg aspect-video object-cover" />
        </div>
        <div className="relative">
            <h2 className="font-bold mb-2">Remote User</h2>
            <video ref={remoteRef} autoPlay playsInline className="w-full bg-black rounded-lg aspect-video object-cover" />
        </div>
      </div>
       <div className="mt-6 flex justify-center">
        <Button onClick={handleEndCall} variant="destructive" size="lg">
          End Call
        </Button>
      </div>
    </div>
  );
}
