"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startCall } from "@/lib/calls";
import { Phone, Loader2 } from "lucide-react";
import { Button } from "./ui/button";

interface CallButtonProps {
  callerId: string;
  calleeId: string;
}

export default function CallButton({ callerId, calleeId }: CallButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCall = async () => {
    try {
      setLoading(true);
      console.log("🔥 BEFORE startCall");
      const callId = await startCall(callerId, calleeId);
      console.log("🔥 AFTER startCall", callId);
      router.push(`/call/${callId}`);
    } catch (err) {
      console.error("Call start error:", err);
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCall}
      disabled={loading}
      variant="default"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Calling...
        </>
      ) : (
        <>
          <Phone className="w-4 h-4" />
          Call
        </>
      )}
    </Button>
  );
}
