"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Phone } from "lucide-react";
import { v4 as uuid } from "uuid";
import { doc, setDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { createCall } from "@/lib/firestore";

type CallButtonProps = {
  calleeId: string;
  calleeName: string;
  isOnline: boolean;
};

export default function CallButton({ calleeId, calleeName, isOnline }: CallButtonProps) {
  const { user, userProfile, db, functions: funcs } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Hide call button on own profile
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

    if (!db || !funcs) {
      toast({
        variant: "destructive",
        title: "Database Error",
        description: "Could not connect to the database or functions.",
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
      // 1️⃣ Генеруємо callId та створюємо документи
      toast({
        title: "Calling...",
        description: `Connecting you with ${calleeName}.`,
      });
      
      const callId = await createCall(db, user.uid, calleeId, userProfile.displayName);

      // 2️⃣ Викликаємо Cloud Function createDailyRoom
      const createRoom = httpsCallable(funcs, "createDailyRoom");
      const result: any = await createRoom({ callId });

      if (!result?.data?.roomUrl) {
        throw new Error("No room URL received from Daily API");
      }

      // 3️⃣ Після отримання roomUrl → переходимо у кімнату
      router.push(`/call/${callId}`);

    } catch (error: any) {
      console.error("Call initiation failed:", error);
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
        isOnline ? "bg-green-500 hover:bg-green-600" : "bg-red-500 cursor-not-allowed opacity-70"
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
