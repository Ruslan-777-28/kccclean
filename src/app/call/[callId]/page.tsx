"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { getClientServices } from "@/lib/firebase";
import { fetchVideoSDKToken } from "@/lib/videosdk";
import { MeetingProvider, useMeeting, useParticipant } from "@videosdk.live/react-sdk";

// ----------------------------
// ВІДЕО-КОМПОНЕНТ
// ----------------------------
function ParticipantView({ participantId }: { participantId: string }) {
  const { webcamStream, micStream, isLocal, isActiveSpeaker } =
    useParticipant(participantId);

  const videoRef = React.useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (webcamStream && videoRef.current) {
      const mediaStream = new MediaStream();

      mediaStream.addTrack(webcamStream.track);
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch(() => {});
    }
  }, [webcamStream]);

  return (
    <div
      style={{
        border: isLocal ? "2px solid #4caf50" : "2px solid transparent",
        padding: "4px",
        borderRadius: "8px",
        width: "300px",
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        muted={isLocal}
        playsInline
        style={{
          width: "100%",
          borderRadius: "8px",
        }}
      ></video>
    </div>
  );
}

// ----------------------------
// ОСНОВНИЙ ВХІД У КІМНАТУ
// ----------------------------
function MeetingContainer({
  roomId,
  token,
}: {
  roomId: string;
  token: string;
}) {
  const [joined, setJoined] = useState(false);
  const { join, participants, leave } = useMeeting({
    onMeetingJoined: () => {
      console.log("Meeting joined");
      setJoined(true);
    },
    onMeetingLeft: () => {
      console.log("Meeting left");
    },
  });

  useEffect(() => {
    console.log("Joining meeting:", roomId);
    join();
  }, []);

  return (
    <div
      style={{
        padding: "25px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <h2 style={{ fontSize: "22px", fontWeight: "bold" }}>
        Room: {roomId}
      </h2>

      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        {[...participants.keys()].map((participantId) => (
          <ParticipantView participantId={participantId} key={participantId} />
        ))}
      </div>

      <button
        onClick={leave}
        style={{
          marginTop: "20px",
          padding: "12px 20px",
          background: "#b71c1c",
          color: "#fff",
          borderRadius: "8px",
          width: "180px",
        }}
      >
        Leave Call
      </button>
    </div>
  );
}

// ----------------------------
// ГОЛОВНА СТОРІНКА CALL
// ----------------------------
export default function CallPage() {
  const params = useParams();
  const router = useRouter();
  const callId = params.callId as string;

  const { db } = getClientServices();

  const [roomId, setRoomId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // 1. ОТРИМУЄМО КІМНАТУ З FIRESTORE
  useEffect(() => {
    if (!callId || !db) return;

    const callRef = doc(db, "calls", callId);

    const unsub = onSnapshot(callRef, (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();
      setRoomId(data.roomId ?? null);

      // Якщо виклик закінчено → виходимо
      if (data.status === "ended" || data.status === "declined") {
        router.push("/");
      }
    });

    return () => unsub();
  }, [callId, db]);

  // 2. ОТРИМУЄМО VideoSDK Token
  useEffect(() => {
    fetchVideoSDKToken().then((t) => setToken(t));
  }, []);

  if (!roomId) {
    return (
      <div style={{ padding: "40px", fontSize: "20px" }}>
        Waiting for call acceptance...
      </div>
    );
  }

  if (!token) {
    return (
      <div style={{ padding: "40px", fontSize: "20px" }}>
        Getting secure token...
      </div>
    );
  }

  return (
    <MeetingProvider
      config={{
        meetingId: roomId,
        micEnabled: true,
        webcamEnabled: true,
        name: "User",
      }}
      token={token}
    >
      <MeetingContainer roomId={roomId} token={token} />
    </MeetingProvider>
  );
}
