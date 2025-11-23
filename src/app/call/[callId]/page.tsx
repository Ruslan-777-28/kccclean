"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { fetchVideoSDKToken } from "@/lib/videosdk";
import CallClient from "@/components/CallClient";
import LoadingScreen from "@/components/LoadingScreen";

export default function CallPage() {
  const { callId } = useParams();
  const router = useRouter();
  const { db } = useAuth();

  const [roomId, setRoomId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !callId) return;

    const unsub = onSnapshot(doc(db, "calls", callId as string), async (snap) => {
      if (!snap.exists()) {
        console.error("Call document not found");
        router.push("/");
        return;
      }

      const callData = snap.data();
       // Якщо виклик закінчено → виходимо
      if (callData.status === "ended" || callData.status === "declined") {
        router.push("/");
        return;
      }

      if (!callData.roomId) return;

      // 🔥 Завантажуємо VideoSDK токен
      const t = await fetchVideoSDKToken();
      setToken(t);

      setRoomId(callData.roomId);
      setLoading(false);
    });

    return () => unsub();
  }, [db, callId, router]);

  if (loading) return <LoadingScreen message="Connecting to call..." />;

  if (!roomId || !token)
    return (
      <LoadingScreen message="Preparing room..." />
    );

  return <CallClient roomId={roomId} token={token} callId={callId as string} />;
}
