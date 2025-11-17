'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile, updateCallStatus } from '@/lib/firestore';
import type { Call, UserPublic } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PhoneOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function CallPlaceholder({ call }: { call: Call }) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [caller, setCaller] = useState<UserPublic | null>(null);
  const [callee, setCallee] = useState<UserPublic | null>(null);

  useEffect(() => {
    async function fetchParticipants() {
      const callerProfile = await getUserProfile(call.callerId);
      const calleeProfile = await getUserProfile(call.calleeId);
      setCaller(callerProfile);
      setCallee(calleeProfile);
    }
    fetchParticipants();
  }, [call.callerId, call.calleeId]);
  
  useEffect(() => {
    if (call.status === 'ended') {
        toast({ title: "Call Ended", description: "This call has ended. You will be redirected." });
        setTimeout(() => router.push('/'), 3000);
    }
  }, [call.status, router, toast]);

  const handleEndCall = async () => {
    await updateCallStatus(call.id, 'ended');
  };
  
  const otherParticipant = user?.uid === caller?.uid ? callee : caller;

  const getStatusMessage = () => {
    switch(call.status) {
        case 'ringing': return `Ringing ${callee?.displayName}...`;
        case 'accepted': return `In call with ${otherParticipant?.displayName}`;
        case 'ended': return 'Call ended.';
        case 'declined': return `${callee?.displayName} declined the call.`;
        default: return 'Connecting...'
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-2xl text-primary">{getStatusMessage()}</CardTitle>
        <Badge variant={call.status === 'accepted' ? 'default' : 'secondary'} className={cn(
            "mx-auto w-fit capitalize",
            call.status === 'ringing' && 'bg-blue-500 text-white',
            call.status === 'accepted' && 'bg-green-500 text-white',
            call.status === 'ended' && 'bg-gray-500 text-white',
            call.status === 'declined' && 'bg-red-500 text-white',
        )}>{call.status}</Badge>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-video bg-black rounded-lg flex items-center justify-center text-white overflow-hidden">
          {/* This is where the Daily.co iframe will be mounted */}
          <div id="video-frame" className="w-full h-full" />
          
          {call.status !== 'accepted' && (
            <div className="absolute inset-0 flex items-center justify-around bg-black/50">
                <div className="text-center">
                    <Avatar className="h-32 w-32 border-4">
                        <AvatarImage src={caller?.photoURL} />
                        <AvatarFallback>{caller?.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="mt-2 font-semibold text-lg">{caller?.displayName} (You)</p>
                </div>
                <div className="text-center">
                    <Avatar className="h-32 w-32 border-4">
                        <AvatarImage src={callee?.photoURL} />
                        <AvatarFallback>{callee?.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="mt-2 font-semibold text-lg">{callee?.displayName}</p>
                </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        {call.status !== 'ended' && (
            <Button variant="destructive" size="lg" onClick={handleEndCall} className="rounded-full w-16 h-16">
                <PhoneOff className="h-6 w-6" />
                <span className="sr-only">End Call</span>
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}
