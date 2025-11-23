"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Phone } from "lucide-react";
import { startCall } from "@/lib/firestore";

type CallButtonProps = {
  calleeId: string;
  calleeName: string;
  isOnline: boolean;
};

export default function CallButton({ calleeId, calleeName, isOnline }: CallButtonProps) {
  const { user, userProfile, db } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  if (!user || user.uid === calleeId) return null;

  const handleCall = async () => {
    if (!user || !userProfile) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to make a call.",
      });
      router.push("/login");
      return;
    }

    if (!db) {
      toast({
        variant: "destructive",
        title: "Initialization Error",
        description: "Firebase services are not ready.",
      });
      return;
    }

    if (!isOnline) {
      toast({
        variant: "destructive",
        title: "User Offline",
        description: `${calleeName} is currently offline.`,
      });
      return;
    }

    setLoading(true);

    try {
      toast({
        title: "Starting Call...",
        description: `Connecting you with ${calleeName}.`,
      });

      // 1) Create calls + incoming documents in Firestore
      const callId = await startCall(db, user.uid, calleeId, userProfile.displayName || "Anonymous Caller");
      
      // 2) Navigate to the call page. The callee will create the room on accept.
      router.push(`/call/${callId}`);

    } catch (error: any) {
      console.error("❌ startCall failed:", error);
      toast({
        variant: "destructive",
        title: "Call Failed",
        description: error.message || "Could not initiate the call.",
      });
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCall}
      disabled={loading || !isOnline}
      className={`w-full transition-colors ${
        isOnline ? "bg-green-500 hover:bg-green-600" : "bg-gray-500 cursor-not-allowed opacity-70"
      }`}
      title={isOnline ? `Call ${calleeName}` : `${calleeName} is offline`}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Phone className="mr-2 h-4 w-4" />
      )}
      {loading ? "Connecting..." : isOnline ? `Call ${calleeName}` : "Offline"}
    </Button>
  );
}
