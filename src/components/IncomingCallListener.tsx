"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { updateCallStatus, getUserProfile } from "@/lib/firestore";
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
import { collection, deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";

type IncomingCallData = {
  callId: string;
  callerId: string;
  callerName: string;
};

export default function IncomingCallListener() {
  const { user, db } = useAuth();
  const router = useRouter();
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  
  useEffect(() => {
    if (!user || !db) return;

    const incomingDocRef = doc(db, "incoming", user.uid);
    
    const unsubscribe = onSnapshot(incomingDocRef, (snap) => {
        if (snap.exists() && snap.data().callId) {
            setIncomingCall(snap.data() as IncomingCallData);
        } else {
            setIncomingCall(null);
        }
    });

    return () => unsubscribe();
  }, [user, db]);

  const clearIncomingDoc = async () => {
    if (!db || !user) return;
    await deleteDoc(doc(db, "incoming", user.uid));
    setIncomingCall(null);
  }

  const handleAccept = async () => {
    if (!incomingCall || !db) return;
    await updateCallStatus(db, incomingCall.callId, "accepted");
    router.push(`/call/${incomingCall.callId}`);
    await clearIncomingDoc();
  };

  const handleDecline = async () => {
    if (!incomingCall || !db) return;
    await updateCallStatus(db, incomingCall.callId, "declined");
    await clearIncomingDoc();
  };

  return (
    <AlertDialog open={!!incomingCall}>
      <AlertDialogContent>
        <AlertDialogHeader className="items-center text-center">
          <AlertDialogTitle className="font-headline text-2xl">Вхідний дзвінок</AlertDialogTitle>
          <AlertDialogDescription>
            Вам телефонує{" "}
            <span className="font-bold text-primary">{incomingCall?.callerName || "Unknown"}</span>.
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
