"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { listenToIncomingCalls, updateCallStatus, getUserProfile } from "@/lib/firestore";
import type { Call, UserPublic } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export default function IncomingCallListener() {
  const { user } = useAuth();
  const router = useRouter();
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const [callerProfile, setCallerProfile] = useState<UserPublic | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = listenToIncomingCalls(user.uid, async (calls) => {
      const call = calls.length > 0 ? calls[0] : null;
      if (call) {
        const profile = await getUserProfile(call.callerId);
        setCallerProfile(profile);
        setIncomingCall(call);
      } else {
        setIncomingCall(null);
        setCallerProfile(null);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleAccept = async () => {
    if (!incomingCall) return;
    await updateCallStatus(incomingCall.id, "accepted");
    router.push(`/call/${incomingCall.id}`);
    setIncomingCall(null);
  };

  const handleDecline = async () => {
    if (!incomingCall) return;
    await updateCallStatus(incomingCall.id, "declined");
    setIncomingCall(null);
  };

  return (
    <AlertDialog open={!!incomingCall}>
      <AlertDialogContent>
        <AlertDialogHeader className="items-center text-center">
            {callerProfile && (
                <Avatar className="h-20 w-20 mb-4">
                    <AvatarImage src={callerProfile.photoURL} alt={callerProfile.displayName} />
                    <AvatarFallback>{callerProfile.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
            )}
          <AlertDialogTitle className="font-headline text-2xl">Incoming Call</AlertDialogTitle>
          <AlertDialogDescription>
            You have an incoming call from{" "}
            <span className="font-bold text-primary">{callerProfile?.displayName || "Unknown"}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction onClick={handleAccept} className="bg-green-600 hover:bg-green-700">Accept</AlertDialogAction>
          <AlertDialogCancel onClick={handleDecline} className="bg-red-600 hover:bg-red-700 text-white">Decline</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
