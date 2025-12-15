"use client";

import { acceptCall, declineCall } from "@/lib/calls";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface IncomingCallModalProps {
  callId: string;
  callerId: string;
  onClose: () => void;
}

export default function IncomingCallModal({
  callId,
  callerId,
  onClose,
}: IncomingCallModalProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleAccept = async () => {
    try {
      setLoading(true);
      const roomId = await acceptCall(callId);
      onClose();
      router.push(`/call/${roomId}`);
    } catch (err: any) {
      console.error("Accept failed:", err);
      toast({
        variant: "destructive",
        title: "Failed to accept call",
        description: err.message,
      });
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    try {
      await declineCall(callId);
      onClose();
    } catch (err: any)
      console.error("Decline error:", err);
       toast({
        variant: "destructive",
        title: "Failed to decline call",
        description: err.message,
      });
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
    >
      <div className="bg-white p-6 rounded-2xl shadow-xl w-80 text-center">
        <h2 className="text-xl font-bold mb-3">Incoming Call</h2>

        <p className="text-gray-600 mb-6">
          User <b>{callerId}</b> is calling you...
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={handleDecline}
            className="px-4 py-2 bg-red-500 text-white rounded-lg"
          >
            Decline
          </button>

          <button
            onClick={handleAccept}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? "Connecting..." : "Accept"}
          </button>
        </div>
      </div>
    </div>
  );
}
