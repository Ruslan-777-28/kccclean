"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { fetchVideoSDKToken } from "@/lib/videosdk";
import { MeetingProvider } from "@videosdk.live/react-sdk";
import { Loader2 } from "lucide-react";
import type { Call } from "@/lib/types";
import { VideoCallUI } from "@/components/VideoCallUI";

export default function CallPage() {
  const params = useParams<{ callId: string }>();
  const callId = params?.callId as string;
  const router = useRouter();

  const { user, db } = useAuth();

  const [call, setCall] = useState<Call | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --------- FIRESTORE SUBSCRIBE ---------
  useEffect(() => {
    if (!db || !callId) return;

    const ref = doc(db, "calls", callId);

    const unsub = onSnapshot(ref, async (snap) => {
      if (!snap.exists()) {
        setError("Call not found.");
        setTimeout(() => router.replace("/"), 2000);
        return;
      }

      const data = { id: snap.id, ...snap.data() } as Call;
      setCall(data);

      if (data.status === "ended" || data.status === "declined") {
        setError("This call has ended.");
        setTimeout(() => router.replace("/"), 2000);
        return;
      }

      // --------- WHEN ROOM IS READY → FETCH TOKEN ---------
      if (
        (data.status === "accepted" || data.status === "in-progress") &&
        data.roomId &&
        !token &&
        !loadingToken
      ) {
        setLoadingToken(true);
        try {
          const t = await fetchVideoSDKToken();
          setToken(t);
        } catch (err) {
          console.error("Failed to fetch VideoSDK token", err);
          setError("Failed to authorize video call.");
        } finally {
          setLoadingToken(false);
        }
      }
    });

    return () => unsub();
  }, [callId, db, router, token, loadingToken]);

  // --------- ERROR UI ---------
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500 text-xl">
        {error}
      </div>
    );
  }

  // --------- LOADING SCREEN (initial) ---------
  if (!call || loadingToken) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="text-lg">Preparing your call...</p>
      </div>
    );
  }

  // --------- WAITING FOR ACCEPT ---------
  if (
    call.status === "ringing" ||
    (call.status === "accepted" && !call.roomId)
  ) {
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

  // --------- TOKEN OR ROOM MISSING (rare) ---------
  if (!token || !call.roomId) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p>Authenticating for VideoSDK room...</p>
      </div>
    );
  }

  // --------- READY TO JOIN ---------
  const displayName = user?.displayName || user?.email || "Guest";

  return (
    <MeetingProvider
      token={token}
      config={{
        meetingId: call.roomId,
        name: displayName,
        micEnabled: true,
        webcamEnabled: true,
        multiStream: false,
      }}
      joinWithoutUserInteraction={true}
    >
      <VideoCallUI callId={callId} call={call} />
    </MeetingProvider>
  );
}
