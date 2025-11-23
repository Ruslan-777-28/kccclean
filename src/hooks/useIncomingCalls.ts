"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, limit } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import type { Call } from "@/lib/types";

export function useIncomingCalls(userId: string | null) {
  const { db } = useAuth();
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);

  useEffect(() => {
    if (!userId || !db) {
      setIncomingCall(null); // Clear call if user logs out
      return;
    }

    const callsRef = collection(db, "calls");
    const q = query(
      callsRef,
      where("calleeId", "==", userId),
      where("status", "==", "ringing"),
      limit(1)
    );

    const unsub = onSnapshot(q, (snapshot) => {
        // If the query is empty, it means there are no ringing calls for this user.
        if (snapshot.empty) {
          setIncomingCall(null);
          return;
        }
        
        // Handle changes in the query results.
        snapshot.docChanges().forEach((change) => {
          // A new call document was added that matches the query.
          if (change.type === "added") {
            const doc = change.doc;
            const data = { ...doc.data(), id: doc.id, callId: doc.id } as Call;
            setIncomingCall(data);
          }
          // The call document was removed from the query results (e.g., status changed).
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
