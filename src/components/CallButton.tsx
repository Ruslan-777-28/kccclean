"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createCall } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Phone } from "lucide-react";

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

  // Don't show call button on your own profile
  if (!user || user.uid === calleeId) {
    return null;
  }

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
        title: "Database Error",
        description: "Could not connect to the database.",
      });
      return;
    }

    setLoading(true);
    try {
      toast({
        title: "Starting Call...",
        description: `Connecting you with ${calleeName}.`,
      });
      const callId = await createCall(db, user.uid, calleeId);
      router.push(`/call/${callId}`);
    } catch (error) {
      console.error("Failed to create call:", error);
      toast({
        variant: "destructive",
        title: "Call Failed",
        description: "Could not initiate the call. Please try again.",
      });
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleCall} 
      disabled={loading || !isOnline} 
      className={`w-full transition-colors ${
        isOnline ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 cursor-not-allowed opacity-70'
      }`}
      title={isOnline ? `Call ${calleeName}` : `${calleeName} is offline`}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Phone className="mr-2 h-4 w-4" />
      )}
      {isOnline ? `Call ${calleeName}` : 'Offline'}
    </Button>
  );
}
