"use client";

import { useRouter } from "next/navigation";
import { useIncomingCalls } from "@/hooks/useIncomingCalls";
import { Button } from "./ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Phone, PhoneOff } from "lucide-react";

export function IncomingCallModal() {
  const { incomingCall, accept, decline } = useIncomingCalls();
  const router = useRouter();

  if (!incomingCall) return null;

  const handleAccept = async () => {
    if (!incomingCall) return;
    await accept();
    router.push(`/call/${incomingCall.id}`);
  };

  const handleDecline = async () => {
    await decline();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-[350px] shadow-xl">
        <CardHeader className="text-center">
            <CardTitle className="font-headline text-2xl">Incoming Call</CardTitle>
            <CardDescription>
                You have a call from{' '}
                <span className="font-bold text-primary">{incomingCall.callerName || 'Unknown Caller'}</span>.
            </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center gap-4">
            <Button onClick={handleAccept} className="bg-green-600 hover:bg-green-700">
                <Phone className="mr-2 h-4 w-4" />
                Accept
            </Button>
            <Button onClick={handleDecline} variant="destructive">
                <PhoneOff className="mr-2 h-4 w-4" />
                Decline
            </Button>
        </CardFooter>
       </Card>
    </div>
  );
}
