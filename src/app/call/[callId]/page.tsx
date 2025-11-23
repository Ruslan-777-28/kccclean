"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { fetchVideoSDKToken } from "@/lib/videosdk";
import { MeetingProvider } from "@videosdk.live/react-sdk";
import { VideoCallUI } from "@/components/VideoCallUI";
import type { Call } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function CallPage() {
  const params = useParams<{ callId: string }>();
  const callId = params?.callId as string | undefined;
  const router = useRouter();

  const { db, user } = useAuth();
  const [call, setCall] = useState<Call | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to the call document
  useEffect(() => {
    if (!db || !callId) return;

    const ref = doc(db, "calls", callId);
    const unsub = onSnapshot(ref, async (snap) => {
      if (!snap.exists()) {
        setError("Call not found.");
        setTimeout(() => router.replace("/"), 3000);
        return;
      }

      const data = { id: snap.id, ...snap.data() } as Call;
      setCall(data);

      // If the call has ended or was declined, redirect
      if (data.status === "ended" || data.status === "declined") {
        setError("This call has ended.");
        setTimeout(() => router.replace("/"), 3000);
        return;
      }

      // Once the room is ready, get the token to join
      if (
        (data.status === "accepted" || data.status === "in-progress") &&
        data.roomId &&
        !token &&
        !loadingToken
      ) {
        setLoadingToken(true);
        try {
          const fetchedToken = await fetchVideoSDKToken();
          setToken(fetchedToken);
        } catch (err) {
            console.error("Failed to fetch VideoSDK token", err);
            setError("Failed to get authorization for video call.");
        } finally {
          setLoadingToken(false);
        }
      }
    });

    return () => unsub();
  }, [callId, router, token, loadingToken, db]);

  if (error) {
     return <div className="flex h-screen items-center justify-center text-red-500"><p>{error}</p></div>;
  }

  if (!call || loadingToken) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="text-lg">Preparing your call...</p>
      </div>
    );
  }

  // Caller is waiting for the callee to accept and create the room
  if (call.status === "ringing" || (call.status === "accepted" && !call.roomId)) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="text-lg">
          {call.status === "ringing"
            ? "Ringing..."
            : "Connecting to the room..."}
        </p>
      </div>
    );
  }

  if (!token || !call.roomId) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p>Authenticating for VideoSDK room...</p>
      </div>
    );
  }
  
  const displayName = user?.displayName || user?.email || "Guest";

  return (
    <MeetingProvider
      config={{
        meetingId: call.roomId,
        name: displayName,
        micEnabled: true,
        webcamEnabled: true,
        multiStream: false,
      }}
      token={token}
      joinWithoutUserInteraction={true}
    >
      <VideoCallUI callId={callId as string} call={call} />
    </MeetingProvider>
  );
}
