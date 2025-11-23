"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  DocumentData,
  orderBy,
  limit,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { acceptCall, declineCall } from "@/lib/calls";
import type { Call } from "@/lib/types";


export function useIncomingCalls() {
  const { user, db } = useAuth();
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);

  useEffect(() => {
    if (!user || !db) return;

    // слухаємо дзвінки, що адресовані саме цьому юзеру
    const callsRef = collection(db, "calls");
    const q = query(
      callsRef,
      where("calleeId", "==", user.uid),
      where("status", "==", "ringing"),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setIncomingCall(null);
        return;
      }

      const doc = snapshot.docs[0];
      const data = doc.data() as DocumentData;

      setIncomingCall({
        id: doc.id,
        ...data
      } as Call);
    });

    return () => unsubscribe();
  }, [user, db]);

  async function accept() {
    if (!incomingCall || !db) return;
    await acceptCall(incomingCall.id);
  }

  async function decline() {
    if (!incomingCall || !db) return;
    await declineCall(incomingCall.id);
  }

  return {
    incomingCall,
    accept,
    decline,
  };
}
