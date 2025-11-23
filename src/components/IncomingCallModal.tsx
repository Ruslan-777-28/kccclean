"use client";

import { acceptCall, declineCall } from "@/lib/calls";
import { useState } from "react";
import { useRouter } from "next/navigation";

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

  const handleAccept = async () => {
    try {
      setLoading(true);
      const roomId = await acceptCall(callId);
      onClose();

      // 🔥 Переходимо в кімнату
      router.push(`/call/${callId}`);
    } catch (err) {
      console.error("Accept failed:", err);
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    try {
      await declineCall(callId);
      onClose();
    } catch (err) {
      console.error("Decline error:", err);
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
