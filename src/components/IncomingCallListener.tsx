"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { updateCallStatus } from "@/lib/firestore";
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
import { deleteDoc, doc, onSnapshot } from "firebase/firestore";

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
    try {
        await deleteDoc(doc(db, "incoming", user.uid));
    } catch (error) {
        console.error("Failed to clear incoming call document:", error);
    }
    setIncomingCall(null);
  }

  const handleAccept = async () => {
    if (!incomingCall || !db) return;
    await updateCallStatus(db, incomingCall.callId, "accepted");
    await clearIncomingDoc();
    router.push(`/call/${incomingCall.callId}`);
  };

  const handleDecline = async () => {
    if (!incomingCall || !db) return;
    await updateCallStatus(db, incomingCall.callId, "declined");
    await clearIncomingDoc();
  };

  if (!incomingCall) {
    return null;
  }

  return (
    <AlertDialog open={!!incomingCall}>
      <AlertDialogContent>
        <AlertDialogHeader className="items-center text-center">
          <AlertDialogTitle className="font-headline text-2xl">Incoming Call</AlertDialogTitle>
          <AlertDialogDescription>
            You have a call from{" "}
            <span className="font-bold text-primary">{incomingCall?.callerName || "Unknown"}</span>.
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
