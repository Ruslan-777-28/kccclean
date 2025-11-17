"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { listenToCall, createDailyRoom } from "@/lib/firestore";
import type { Call } from "@/lib/types";
import CallPlaceholder from "@/components/CallPlaceholder";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function CallPage() {
  const params = useParams();
  const callId = params.callId as string;
  const { db, functions } = useAuth();
  const { toast } = useToast();
  const [callData, setCallData] = useState<Call | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const roomCreationAttempted = useRef(false);

  useEffect(() => {
    if (!callId || !db || !functions) return;

    const unsubscribe = listenToCall(db, callId, async (call) => {
      if (call) {
        setCallData(call);
        setError(null);
        
        // Create room only once when call is accepted
        if (call.status === "accepted" && !call.roomUrl && !roomCreationAttempted.current) {
          roomCreationAttempted.current = true; // Mark that we are attempting to create a room
          try {
            toast({ title: 'Прийнято!', description: 'Створення відеокімнати...' });
            await createDailyRoom(functions, callId);
            // The listener will pick up the roomUrl update automatically
          } catch(err) {
              console.error("Error creating Daily room:", err);
              toast({ variant: 'destructive', title: 'Помилка кімнати', description: 'Не вдалося створити відеокімнату.'});
              setError('Не вдалося створити відеокімнату.');
          }
        }

      } else {
        setError("Дзвінок не знайдено або його було видалено.");
        setCallData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [callId, db, functions, toast]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <p className="text-lg text-primary">Налаштування дзвінка...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-center">
        <div>
          <h1 className="text-2xl font-headline text-destructive">Помилка</h1>
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
