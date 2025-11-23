"use client";

import { useEffect, useState } from "react";
import { onSnapshot, collection, query, where, orderBy, limit } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import type { Call } from "@/lib/types";
import { acceptCall, declineCall } from "@/lib/calls";

export function useIncomingCalls() {
  const { user, db } = useAuth();
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);

  useEffect(() => {
    if (!user || !db) return;

    const callsRef = collection(db, "calls");

    const q = query(
      callsRef,
      where("calleeId", "==", user.uid),
      where("status", "==", "ringing"),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (snap.empty) {
        setIncomingCall(null);
        return;
      }

      const doc = snap.docs[0];
      const data = { id: doc.id, ...doc.data() } as Call;

      // Add callerName if it exists on the document
      if (doc.data().callerName) {
        data.callerName = doc.data().callerName;
      }

      setIncomingCall(data);
    });

    return () => unsub();
  }, [user, db]);

  async function accept() {
    if (!incomingCall) return;
    await acceptCall(incomingCall.id);
  }

  async function decline() {
    if (!incomingCall) return;
    await declineCall(incomingCall.id);
    setIncomingCall(null);
  }

  return {
    incomingCall,
    accept,
    decline,
  };
}
