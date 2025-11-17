"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { listenToCall } from "@/lib/firestore";
import type { Call } from "@/lib/types";
import CallPlaceholder from "@/components/CallPlaceholder";
import { useAuth } from "@/context/AuthContext";

export default function CallPage() {
  const params = useParams();
  const callId = params.callId as string;
  const { db } = useAuth();
  const [callData, setCallData] = useState<Call | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!callId || !db) return;

    const unsubscribe = listenToCall(db, callId, (call) => {
      if (call) {
        setCallData(call);
        setError(null);
      } else {
        setError("Call not found or has been deleted.");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [callId, db]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <p className="text-lg text-primary">Setting up your call...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-center">
        <div>
          <h1 className="text-2xl font-headline text-destructive">Error</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {callData && <CallPlaceholder call={callData} />}
    </div>
  );
}
