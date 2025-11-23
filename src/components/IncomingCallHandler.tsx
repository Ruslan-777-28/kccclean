"use client";

import { useIncomingCalls } from "@/hooks/useIncomingCalls";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { useAuth } from "@/context/AuthContext";

export default function IncomingCallHandler() {
  const { incomingCall, accept, decline } = useIncomingCalls();
  const router = useRouter();
  const { userProfile } = useAuth();

  if (!incomingCall || !userProfile) return null;

  const handleAccept = async () => {
    if (!incomingCall) return;
    try {
        await accept();
        router.push(`/call/${incomingCall.id}`);
    } catch(e) {
        console.error("Failed to accept call", e);
    }
  };

  const handleDecline = async () => {
    if (!incomingCall) return;
    await decline();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
       <Card className="w-[350px]">
        <CardHeader className="text-center">
            <CardTitle className="font-headline text-2xl">Incoming Call</CardTitle>
            <CardDescription>
                You have a call from{' '}
                <span className="font-bold text-primary">{incomingCall.callerName || 'Unknown Caller'}</span>.
            </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center gap-4">
            <Button onClick={handleAccept} className="bg-green-600 hover:bg-green-700">
                Accept
            </Button>
            <Button onClick={handleDecline} variant="destructive">
                Decline
            </Button>
        </CardFooter>
       </Card>
    </div>
  );
}
