"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MeetingProvider } from "@videosdk.live/react-sdk";
import { fetchVideoSDKToken } from "@/lib/videosdk";
import VideoCallUI from "@/components/VideoCallUI";
import LoadingScreen from "@/components/LoadingScreen";

export default function CallPage() {
  const { callId } = useParams();
  const router = useRouter();

  const [roomId, setRoomId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!callId) return;
      try {
        setLoading(true);
        // 1. Fetch token and room data in parallel
        const [tokenRes, roomRes] = await Promise.all([
          fetchVideoSDKToken(),
          fetch(`/api/get-call-room?callId=${callId}`)
        ]);

        if (!roomRes.ok) {
            const errorData = await roomRes.json();
            throw new Error(errorData.error || "Failed to fetch room data");
        }

        const roomData = await roomRes.json();
        
        setToken(tokenRes);
        setRoomId(roomData.roomId);

      } catch (err: any) {
        console.error("CallPage load error:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [callId, router]);
  
  if (loading) return <LoadingScreen message="Connecting..." />;
  if (error) return <LoadingScreen message={`Error: ${error}`} />;
  if (!roomId || !token) return <LoadingScreen message="Could not initialize call." />;

  return (
    <MeetingProvider
      token={token}
      config={{
        meetingId: roomId,
        name: "User", // You can replace this with the actual user's name
        micEnabled: true,
        webcamEnabled: true,
      }}
    >
      <VideoCallUI roomId={roomId} callId={callId as string}/>
    </MeetingProvider>
  );
}
