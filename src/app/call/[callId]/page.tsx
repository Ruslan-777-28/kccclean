"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CallPage({ params }: { params: { callId: string } }) {
  const { db } = useAuth();
  const router = useRouter();
  const iframeRef = useRef<HTMLDivElement | null>(null);
  const callRef = useRef<DailyCall | null>(null);

  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------- 1. SUBSCRIBE TO CALL DOCUMENT ----------
  useEffect(() => {
    if (!db) {
        setError("Database connection not available.");
        setLoading(false);
        return;
    };

    const callDocRef = doc(db, "calls", params.callId);

    const unsub = onSnapshot(callDocRef, (snap) => {
      if (!snap.exists()) {
        setError("Call not found.");
        setLoading(false);
        return;
      }
      const data = snap.data();

      if (data.roomUrl) {
        setRoomUrl(data.roomUrl);
        setLoading(false);
      }
      
      if (data.status === 'ended' || data.status === 'declined') {
        setError("This call has ended.");
        setLoading(false);
        handleLeave();
      }
    }, (err) => {
        console.error("Firestore snapshot error:", err);
        setError("Failed to listen to call data.");
        setLoading(false);
    });

    return () => unsub();
  }, [db, params.callId]);

  // ---------- 2. SETUP DAILY IFRAME ----------
  useEffect(() => {
    if (!roomUrl) return;
    if (!iframeRef.current) return;

    // Destroy any existing call object
    if (callRef.current) {
        callRef.current.destroy();
    }

    // Create Daily call object
    const call = DailyIframe.createCallObject({
        // url: roomUrl // URL is provided in join()
    });
    callRef.current = call;

    // Join the call
    call
      .join({
        url: roomUrl,
        showLeaveButton: false, // We use our own leave button
        showFullscreenButton: true,
      })
      .then(() => {
        // Embed the iframe into our container
        if (iframeRef.current) {
            call.iframe(iframeRef.current)?.style.setProperty('display', 'block');
        }
      })
      .catch((err) => {
        console.error("Daily join error:", err)
        setError("Could not join the video room.");
      });

    // --- Event Listeners for Cleanup ---
    const handleLeftMeeting = () => {
        // This is called when the user is ejected or leaves via other means
        router.push("/");
    };

    call.on('left-meeting', handleLeftMeeting);

    // Cleanup when component unmounts
    return () => {
      call.off('left-meeting', handleLeftMeeting);
      
      // Ensure we leave and destroy the call object
      // This is a safeguard
      call?.leave().then(() => call?.destroy()).catch(() => call?.destroy());
    };
  }, [roomUrl, router]);

  // ---------- 3. END CALL ----------
  const handleLeave = async () => {
    if (callRef.current) {
      try {
        await callRef.current.leave();
        await callRef.current.destroy();
        callRef.current = null;
      } catch (e) {
        console.error("Error leaving Daily call", e);
        // Destroy anyway
        if(callRef.current) {
          callRef.current.destroy();
          callRef.current = null;
        }
      }
    }
    router.push("/"); // Go back to home page
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
      
      {/* TOP BAR */}
      <div className="w-full flex justify-between items-center p-4 bg-gray-900 text-white z-10">
        <h1 className="text-lg font-headline font-semibold">ConnectNow Call</h1>
        <Button
          onClick={handleLeave}
          variant="destructive"
        >
          Leave Call
        </Button>
      </div>

      {/* DAILY VIDEO AREA */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
            <p className="ml-4 text-white">Connecting to video call...</p>
          </div>
        )}

        <div
          ref={iframeRef}
          className="w-full h-full"
          style={{ display: loading || error ? 'none' : 'block' }}
        />
      </div>
    </div>
  );
}
