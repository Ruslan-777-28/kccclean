"use client";

import { useEffect, useState } from "react";
import { MeetingProvider } from "@videosdk.live/react-sdk";
import { useAuth } from "@/context/AuthContext";
import LoadingScreen from "@/components/LoadingScreen";
import CallUIView from "./CallUIView";
import { fetchVideoSDKToken } from "@/lib/videosdk";
import { doc, onSnapshot } from "firebase/firestore";
import type { Call } from "@/lib/types";

export default function CallPage({ callId }: { callId: string }) {
  const { db } = useAuth();

  const [token, setToken] = useState<string | null>(null);
  const [callData, setCallData] = useState<Call | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch token on mount
  useEffect(() => {
    fetchVideoSDKToken()
      .then(setToken)
      .catch(() => setError("Failed to get VideoSDK token"));
  }, []);

  // Subscribe to call document
  useEffect(() => {
    if (!db || !callId) return;

    const unsub = onSnapshot(
      doc(db, "calls", callId),
      (docSnap) => {
        if (!docSnap.exists()) {
          setError("Call not found.");
          setLoading(false);
          return;
        }
        const data = docSnap.data() as Call;
        setCallData(data);

        if (data.status === "declined" || data.status === "ended") {
          setError("Call ended or declined.");
        }

        if (data.roomId) {
          setLoading(false);
        }
      },
      () => {
        setError("Failed to listen for call updates.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [db, callId]);

  if (loading) return <LoadingScreen message="Connecting..." />;
  if (error) return <LoadingScreen message={error} />;
  if (!callData?.roomId || !token)
    return <LoadingScreen message="Waiting for connection..." />;

  return (
    <MeetingProvider
      token={token}
      config={{
        meetingId: callData.roomId,
        name: "User",
        micEnabled: true,
        webcamEnabled: true,
      }}
    >
      <CallUIView callId={callId} roomId={callData.roomId} />
    </MeetingProvider>
  );
}
