"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function CallPage() {
  const { db, user } = useAuth();
  const router = useRouter();
  const params = useParams<{ callId: string }>();
  const callId = params?.callId as string | undefined;

  const { toast } = useToast();
  const iframeRef = useRef<HTMLDivElement | null>(null);
  const callRef = useRef<DailyCall | null>(null);

  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------- 1. SUBSCRIBE TO CALL DOCUMENT ----------
  useEffect(() => {
    if (!db || !callId || !user) {
      if (!user) {
        setError("Please log in to join a call.");
        setLoading(false);
      }
      return;
    }

    const callDocRef = doc(db, "calls", callId);

    const unsub = onSnapshot(
      callDocRef,
      (snap) => {
        if (!snap.exists()) {
          console.log("Waiting for call document to be created...");
          return;
        }

        const data = snap.data() as any;

        // Перевіряємо, чи юзер учасник дзвінка
        if (user && data.callerId !== user.uid && data.calleeId !== user.uid) {
          setError("You are not a participant in this call.");
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You are not a participant in this call.",
          });
          setLoading(false);
          setTimeout(() => router.push("/"), 3000);
          return;
        }

        if (data.roomUrl) {
          setRoomUrl(data.roomUrl);
          setLoading(false);
          setError(null);
        }

        if (data.status === "ended" || data.status === "declined") {
          toast({
            title: "Call Ended",
            description: "This call has ended or was declined.",
          });
          // не міняємо статус ще раз
          handleLeave(false);
        }
      },
      (err) => {
        if (err.code === "permission-denied") {
          setError(
            "Waiting for call details to be available... If this persists, you may not have access."
          );
          // лишаємо loading = true, щоб ще трохи почекати
        } else {
          console.error("Firestore snapshot error:", err);
          setError("Failed to listen to call data.");
          setLoading(false);
        }
      }
    );

    // Таймаут, щоб не чекати вічно
    const timeoutId = setTimeout(() => {
      if (loading && !roomUrl) {
        setError(
          "Could not join the call. The room may not exist or you don't have permission."
        );
        toast({
          variant: "destructive",
          title: "Failed to Join",
          description: "Redirecting to homepage...",
        });
        setLoading(false);
        setTimeout(() => router.push("/"), 3000);
      }
    }, 15000);

    return () => {
      unsub();
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, callId, router, user, toast]);

  // ---------- 2. SETUP DAILY IFRAME ----------
  useEffect(() => {
    if (!roomUrl || !iframeRef.current || callRef.current) return;

    const call = DailyIframe.createCallObject();
    callRef.current = call;

    // очистити контейнер
    iframeRef.current.innerHTML = "";

    call
      .join({ url: roomUrl, showLeaveButton: false, showFullscreenButton: true })
      .then(() => {
        const iframe = call.iframe();
        if (iframe && iframeRef.current) {
          iframeRef.current.appendChild(iframe);
        }
      })
      .catch((err) => {
        console.error("Daily join error:", err);
        setError("Could not join the video room.");
        toast({
          variant: "destructive",
          title: "Video Error",
          description: "Failed to connect to the video service.",
        });
      });

    const handleLeftMeeting = () => {
      router.push("/");
    };
    call.on("left-meeting", handleLeftMeeting);

    return () => {
      call.off("left-meeting", handleLeftMeeting);
      if (callRef.current) {
        callRef.current.destroy();
        callRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomUrl, router]);

  // ---------- 3. END CALL ----------
  const handleLeave = async (updateStatus = true) => {
    if (callRef.current) {
      try {
        await callRef.current.leave();
      } catch (e) {
        console.error("Error leaving Daily call:", e);
      }
    }

    if (db && updateStatus && callId) {
      try {
        await updateDoc(doc(db, "calls", callId), { status: "ended" });
      } catch (e) {
        console.error("Failed to update call status:", e);
      }
    }

    router.push("/");
  };

  // ---------- RENDERING ----------
  if (loading) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-black text-white p-4">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="mt-4 text-lg">{error || "Connecting to call..."}</p>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-black text-white p-4">
        <h1 className="text-2xl font-bold text-red-500 mb-4">
          An Error Occurred
        </h1>
        <p className="text-lg mb-6 text-center">{error}</p>
        <Button onClick={() => router.push("/")} variant="secondary">
          Go to Homepage
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-black">
      <div className="w-full flex justify-between items-center p-4 bg-gray-900 text-white z-10">
        <h1 className="text-lg font-headline font-semibold">ConnectNow Call</h1>
        <Button onClick={() => handleLeave()} variant="destructive">
          Leave Call
        </Button>
      </div>

      <div className="flex-1 relative">
        {!roomUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white">
            <Loader2 className="w-10 h-10 animate-spin" />
            <p className="mt-4">Waiting for room to be created...</p>
          </div>
        )}
        <div ref={iframeRef} className="w-full h-full" />
      </div>
    </div>
  );
}
