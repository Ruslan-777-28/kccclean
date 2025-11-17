"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function CallPage({ params }: { params: { callId: string } }) {
  const { db, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const iframeRef = useRef<HTMLDivElement | null>(null);
  const callRef = useRef<DailyCall | null>(null);

  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------- 1. SUBSCRIBE TO CALL DOCUMENT ----------
  useEffect(() => {
    if (!db || !params.callId) {
      setError("Database connection not available or Call ID is missing.");
      setLoading(false);
      return;
    }

    const callDocRef = doc(db, "calls", params.callId);

    const unsub = onSnapshot(callDocRef, (snap) => {
      if (!snap.exists()) {
        setError("Call not found. You will be redirected.");
        setLoading(false);
        setTimeout(() => router.push('/'), 3000);
        return;
      }
      const data = snap.data();

      if (data.roomUrl) {
        setRoomUrl(data.roomUrl);
        setLoading(false);
      }
      
      if (data.status === 'ended' || data.status === 'declined') {
         if(!error) { // Prevent multiple toasts
          toast({ title: "Call Ended", description: "This call has ended or was declined." });
          handleLeave(false); // Don't update status again if it's already ended
        }
      }
    }, (err) => {
        console.error("Firestore snapshot error:", err);
        setError("Failed to listen to call data.");
        setLoading(false);
    });

    return () => unsub();
  }, [db, params.callId, router, toast]);

  // ---------- 2. SETUP DAILY IFRAME ----------
  useEffect(() => {
    if (!roomUrl || !iframeRef.current) return;
    if (callRef.current) callRef.current.destroy();

    const call = DailyIframe.createCallObject({ url: roomUrl });
    callRef.current = call;

    const handleLeftMeeting = () => {
      router.push("/");
    };
    call.on('left-meeting', handleLeftMeeting);

    call.join({ showLeaveButton: false, showFullscreenButton: true })
      .then(() => {
        if (iframeRef.current) {
          call.iframe()?.style.setProperty('display', 'block');
          iframeRef.current.appendChild(call.iframe()!);
        }
      })
      .catch((err) => {
        console.error("Daily join error:", err)
        setError("Could not join the video room.");
      });

    return () => {
      call.off('left-meeting', handleLeftMeeting);
      call.leave().then(() => call.destroy()).catch(() => call.destroy());
      callRef.current = null;
    };
  }, [roomUrl, router]);

  // ---------- 3. END CALL ----------
  const handleLeave = async (updateStatus = true) => {
    if (callRef.current) {
      await callRef.current.leave();
    }
    if (db && updateStatus) {
       await updateDoc(doc(db, "calls", params.callId), { status: "ended" });
    }
    router.push("/");
  };
  
  if (error) {
     return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-black text-white p-4">
        <h1 className="text-2xl font-bold text-red-500 mb-4">An Error Occurred</h1>
        <p className="text-lg mb-6">{error}</p>
        <Button onClick={() => router.push('/')}>Go to Homepage</Button>
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
        {(loading || !roomUrl) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white">
            <Loader2 className="w-10 h-10 animate-spin" />
            <p className="mt-4">Waiting for room to be created...</p>
          </div>
        )}
        <div ref={iframeRef} className="w-full h-full" style={{ display: loading ? 'none' : 'block' }}/>
      </div>
    </div>
  );
}
