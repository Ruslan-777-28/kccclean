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
  const { user, db } = useAuth();
  const router = useRouter();
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const [callerProfile, setCallerProfile] = useState<UserPublic | null>(null);

  useEffect(() => {
    if (!user || !db) return;

    const unsubscribe = listenToIncomingCalls(db, user.uid, async (calls) => {
      const call = calls.length > 0 ? calls[0] : null;
      if (call) {
        const profile = await getUserProfile(db, call.callerId);
        setCallerProfile(profile);
        setIncomingCall(call);
      } else {
        setIncomingCall(null);
        setCallerProfile(null);
      }
    });

    return () => unsubscribe();
  }, [user, db]);

  const handleAccept = async () => {
    if (!incomingCall || !db) return;
    await updateCallStatus(db, incomingCall.id, "accepted");
    router.push(`/call/${incomingCall.id}`);
    setIncomingCall(null);
  };

  const handleDecline = async () => {
    if (!incomingCall || !db) return;
    // We'll set status to 'ended' instead of declined to simplify the flow
    await updateCallStatus(db, incomingCall.id, "ended");
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
          <AlertDialogTitle className="font-headline text-2xl">Вхідний дзвінок</AlertDialogTitle>
          <AlertDialogDescription>
            Вам телефонує{" "}
            <span className="font-bold text-primary">{callerProfile?.displayName || "Unknown"}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction onClick={handleAccept} className="bg-green-600 hover:bg-green-700">Прийняти</AlertDialogAction>
          <AlertDialogCancel onClick={handleDecline} className="bg-red-600 hover:bg-red-700 text-white">Відхилити</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
