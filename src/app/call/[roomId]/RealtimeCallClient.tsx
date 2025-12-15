'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';

// Placeholder for the Cloudflare Realtime SDK, which will be loaded dynamically
let Realtime: any = null;

export default function RealtimeCallClient({ roomId }: { roomId: string }) {
  const { user, db } = useAuth();
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId || !user || !db) return;

    async function initializeCall() {
      try {
        setLoading(true);

        // Dynamically import the Realtime SDK
        const { Realtime } = await import('@cloudflare/pages-plugin-realtime/api');

        // Fetch call details from Firestore to determine who is the host/participant
        const callDocRef = doc(db, 'calls', roomId);
        const callDoc = await getDoc(callDocRef);

        if (!callDoc.exists()) {
          throw new Error('Call not found.');
        }

        const callData = callDoc.data();
        const isHost = callData.callerId === user.uid;

        // Prepare presets for token generation
        const presetHost = {
          name: 'host-preset',
          video: {
            enabled: true,
            send: true,
            receive: true,
          },
          audio: {
            enabled: true,
            send: true,
            receive: true,
          },
        };

        const presetParticipant = {
          name: 'participant-preset',
          video: {
            enabled: true,
            send: true,
            receive: true,
          },
          audio: {
            enabled: true,
            send: true,
            receive: true,
          },
        };
        
        // Create a meeting room and get tokens
        const res = await fetch('/api/realtime/create-meeting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            presetHost: presetHost,
            presetParticipant: presetParticipant,
          }),
        });

        if (!res.ok) {
          const errorDetails = await res.json();
          throw new Error(`Failed to create meeting: ${errorDetails.error}`);
        }

        const { hostToken, participantToken } = await res.json();
        const token = isHost ? hostToken : participantToken;
        
        const realtime = new Realtime({
            token: token,
        });

        await realtime.connect();

        realtime.on('connectionStateChange', (event: any) => {
          console.log('Connection state changed:', event);
        });

        realtime.on('track', (event: any) => {
            if (event.track.kind === 'video' && remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = new MediaStream([event.track]);
            }
        });
        
        const devices = await Realtime.getDevices();
        const videoDevice = devices.find((d: any) => d.kind === 'videoinput');
        const audioDevice = devices.find((d: any) => d.kind === 'audioinput');

        if (videoDevice && localVideoRef.current) {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: videoDevice.deviceId }});
            localVideoRef.current.srcObject = stream;
            await realtime.addTrack(stream.getVideoTracks()[0]);
        }

        if(audioDevice) {
             const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: audioDevice.deviceId }});
             await realtime.addTrack(stream.getAudioTracks()[0]);
        }

        setLoading(false);
      } catch (err: any) {
        console.error('Error initializing call:', err);
        setError(err.message);
        setLoading(false);
      }
    }

    initializeCall();

  }, [roomId, user, db]);

  if (loading) {
    return <div>Connecting to call...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Call Room: {roomId}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <h2 className="font-bold">Local Video</h2>
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full bg-black rounded-lg" />
        </div>
        <div>
          <h2 className="font-bold">Remote Video</h2>
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full bg-black rounded-lg" />
        </div>
      </div>
    </div>
  );
}
