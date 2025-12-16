"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, PhoneOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

declare global {
  interface Window {
    Realtime: any;
  }
}

export default function CallPage({ params }: { params: { roomId: string } }) {
  const { roomId } = params;

  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [joined, setJoined] = useState(false);
  const [client, setClient] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !roomId) {
      setError("Room ID or token is missing from the URL.");
      return;
    }

    if (typeof window.Realtime === "undefined") {
      setError("Cloudflare Realtime SDK could not be loaded. Please refresh the page.");
      console.error("Cloudflare Realtime SDK not loaded");
      return;
    }

    let _client: any;

    const initCall = async () => {
      try {
        console.log("Initializing Realtime...");
        _client = new window.Realtime({
          room: roomId,
          token: token,
        });

        setClient(_client);

        _client.on("join", async () => {
          console.log("Successfully joined the room!");
          setJoined(true);
          // Handle local tracks
          try {
            const localTracks = await _client.createMicrophoneAndCameraTracks();
            localTracks.forEach((track: any) => {
              const ms = new MediaStream([track.mediaStreamTrack]);
              if (localVideoRef.current) {
                localVideoRef.current.srcObject = ms;
                localVideoRef.current.play().catch(e => console.error("Local video play failed:", e));
              }
            });
          } catch (trackError) {
             console.error("Error getting media tracks:", trackError);
             setError("Could not access camera or microphone. Please check permissions and try again.");
          }
        });

        _client.on("track-added", ({ participant, track }: any) => {
          console.log("Remote track added from:", participant.id);
          const ms = new MediaStream([track.mediaStreamTrack]);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = ms;
            remoteVideoRef.current.play().catch(e => console.error("Remote video play failed:", e));
          }
        });

        _client.on("participant-joined", (p: any) => {
          console.log("Participant joined:", p.id);
        });

        _client.on("participant-left", (p: any) => {
          console.log("Participant left:", p.id);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        });

        _client.on("error", (err: any) => {
          console.error("Realtime Client Error:", err);
          setError(`Connection error: ${err.message}`);
          setJoined(false);
        })

        await _client.join();

      } catch (err: any) {
        console.error("Failed to initialize or join call:", err);
        setError(`Failed to connect to the call. ${err.message}`);
      }
    };

    initCall();

    return () => {
      _client?.leave();
    };
  }, [token, roomId]);

  const leaveCall = () => {
    if (client) client.leave();
    window.location.href = "/";
  };

  if (error) {
    return (
       <div className="flex h-screen w-full flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-bold text-destructive">Connection Failed</h2>
        <p className="text-destructive/80 max-w-md">{error}</p>
        <Button onClick={() => window.location.href = '/'}>Go to Homepage</Button>
      </div>
    )
  }

  if (!joined) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Connecting to room: {roomId}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-4">Meeting Room</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>You</CardTitle></CardHeader>
          <CardContent>
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full bg-black rounded-lg aspect-video object-cover" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Remote User</CardTitle></CardHeader>
          <CardContent>
             <video ref={remoteVideoRef} autoPlay playsInline className="w-full bg-black rounded-lg aspect-video object-cover" />
          </CardContent>
        </Card>
      </div>
       <div className="mt-6 flex justify-center">
        <Button onClick={leaveCall} variant="destructive" size="lg">
          <PhoneOff className="mr-2 h-4 w-4" />
          Leave Call
        </Button>
      </div>
    </div>
  );
}
