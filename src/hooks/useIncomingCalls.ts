"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, limit } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import type { Call } from "@/lib/types";
import { acceptCall, declineCall } from "@/lib/calls";

export function useIncomingCalls(userId: string | null) {
  const { db } = useAuth();
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);

  useEffect(() => {
    if (!userId || !db) return;

    const callsRef = collection(db, "calls");
    const q = query(
      callsRef,
      where("calleeId", "==", userId),
      where("status", "==", "ringing"),
      limit(1)
    );

    const unsub = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
          setIncomingCall(null);
          return;
        }
        
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const doc = change.doc;
            const data = { id: doc.id, ...doc.data() } as Call;
            setIncomingCall(data);
          }
           if (change.type === "removed") {
            setIncomingCall(null);
          }
        });
      },
      (error) => {
        console.error("Error listening to incoming calls:", error);
        setIncomingCall(null);
      }
    );

    return () => unsub();
  }, [userId, db]);

  const clearIncoming = () => {
    setIncomingCall(null);
  };

  return { incomingCall, clearIncoming };
}
