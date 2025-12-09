"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type VideoSDKType = any;
type MeetingType = any;
type ParticipantType = any;
type StreamType = any;

export default function CallPageClient() {
  // ---------- ROUTER / PARAMS ----------
  const params = useParams<{ callId: string }>();
  const callId = (params?.callId as string) || "";
  const router = useRouter();

  // ---------- STATE ----------
  const [VideoSDK, setVideoSDK] = useState<VideoSDKType | null>(null);
  const [meeting, setMeeting] = useState<MeetingType | null>(null);
  const [isJoined, setIsJoined] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // ---------- HELPERS ----------
  const attachTrackToVideo = (videoEl: HTMLVideoElement | null, track: MediaStreamTrack | null) => {
    if (!videoEl || !track) return;
    const stream = new MediaStream([track]);
    videoEl.srcObject = stream;
    videoEl
      .play()
      .catch((err) => console.warn("🔇 Video play interrupted:", err?.message || err));
  };

  const clearVideo = (videoEl: HTMLVideoElement | null) => {
    if (!videoEl) return;
    const src = videoEl.srcObject as MediaStream | null;
    if (src) {
      src.getTracks().forEach((t) => t.stop());
    }
    videoEl.srcObject = null;
  };

  // ---------- 1. LOAD SDK DYNAMICALLY ----------
  useEffect(() => {
    const loadSDK = async () => {
      try {
        console.log("Loading VideoSDK...");
        const { VideoSDK } = await import("@videosdk.live/js-sdk");
        console.log("Loaded VideoSDK:", VideoSDK);
        setVideoSDK(VideoSDK);
      } catch (err) {
        console.error("❌ Failed to load VideoSDK:", err);
      }
    };

    loadSDK();
  }, []);

  // ---------- 2. GET TOKEN FROM BACKEND ----------
  const fetchToken = async (): Promise<string | null> => {
    try {
      console.log("🔑 Fetching VideoSDK token...");
      const res = await fetch("/api/videosdk-token");
      if (!res.ok) {
        const text = await res.text();
        console.error("❌ /api/videosdk-token responded with", res.status, text);
        return null;
      }
      const data = await res.json();
      console.log("✅ Token received (length):", data?.token?.length);
      return data.token as string;
    } catch (err) {
      console.error("❌ Failed to fetch VideoSDK token:", err);
      return null;
    }
  };

  // ---------- 3. INIT MEETING WHEN SDK + callId READY ----------
  useEffect(() => {
    if (!VideoSDK) {
      console.log("⏳ Waiting for SDK to load...");
      return;
    }
    if (!callId) {
      console.warn("⚠ No callId in route, cannot join meeting.");
      return;
    }

    console.log("🚀 Preparing to init meeting for callId:", callId);

    let meetingInstance: MeetingType | null = null;
    let destroyed = false;

    const initMeeting = async () => {
      const token = await fetchToken();
      if (!token) {
        alert("Cannot start call: VideoSDK token missing or invalid.");
        return;
      }

      try {
        console.log("🎥 Calling VideoSDK.initMeeting...");
        meetingInstance = VideoSDK.initMeeting({
          meetingId: callId,
          name: "User", // TODO: підставити реальний displayName
          micEnabled: true,
          webcamEnabled: true,
          token,
        });

        if (!meetingInstance) {
          console.error("❌ VideoSDK.initMeeting returned null/undefined.");
          return;
        }

        if (destroyed) {
          console.log("🧹 Meeting instance created after unmount, leaving immediately.");
          meetingInstance.leave();
          return;
        }

        console.log("✅ Meeting instance created:", meetingInstance);
        setMeeting(meetingInstance);

        // --- LOCAL PARTICIPANT ---
        meetingInstance.on("meeting-joined", () => {
          console.log("✅ meeting-joined");
          setIsJoined(true);

          const lp: ParticipantType = meetingInstance.localParticipant;
          console.log("👤 Local participant:", lp?.id);

          const videoTrack = lp?.webcamStream?.track as MediaStreamTrack | undefined;

          if (videoTrack && localVideoRef.current) {
            console.log("🎥 Attaching LOCAL webcam track");
            attachTrackToVideo(localVideoRef.current, videoTrack);
          } else {
            console.log("ℹ No local video track yet, will rely on stream-enabled");
          }
        });

        // --- ANY PARTICIPANT JOINED (REMOTE) ---
        meetingInstance.on("participant-joined", (participant: ParticipantType) => {
          console.log("🙋 Remote participant joined:", participant?.id);

          participant.on("stream-enabled", (stream: StreamType) => {
            console.log("📡 Remote stream-enabled:", stream?.kind);

            if (stream.kind === "video" && remoteVideoRef.current) {
              const track = stream.track as MediaStreamTrack;
              console.log("🎥 Attaching REMOTE video track");
              attachTrackToVideo(remoteVideoRef.current, track);
            }
          });

          participant.on("stream-disabled", (stream: StreamType) => {
            console.log("📴 Remote stream-disabled:", stream?.kind);
            if (stream.kind === "video" && remoteVideoRef.current) {
              clearVideo(remoteVideoRef.current);
            }
          });
        });

        // --- PARTICIPANT LEFT ---
        meetingInstance.on("participant-left", (participant: ParticipantType) => {
          console.log("👋 Remote participant left:", participant?.id);
          clearVideo(remoteVideoRef.current);
        });

        // --- MEETING LEFT ---
        meetingInstance.on("meeting-left", () => {
          console.log("🏁 Meeting left");
          clearVideo(localVideoRef.current);
          clearVideo(remoteVideoRef.current);
          setIsJoined(false);
        });

        console.log("▶ Calling meeting.join()...");
        meetingInstance.join();
      } catch (error) {
        console.error("❌ Error during meeting init/join:", error);
      }
    };

    initMeeting();

    return () => {
      destroyed = true;
      if (meetingInstance) {
        console.log("🧹 Cleanup: leaving meeting on unmount");
        meetingInstance.leave();
      }
      clearVideo(localVideoRef.current);
      clearVideo(remoteVideoRef.current);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [VideoSDK, callId]);

  // ---------- 4. END CALL ----------
  const handleEndCall = () => {
    console.log("⏹ End Call clicked");
    if (meeting) {
      try {
        meeting.leave();
      } catch (e) {
        console.warn("⚠ Error on meeting.leave:", e);
      }
    }
    clearVideo(localVideoRef.current);
    clearVideo(remoteVideoRef.current);
    router.push("/");
  };

  // ---------- RENDER ----------
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-black text-white p-8">
      <div className="flex gap-6 w-full max-w-4xl">
        {/* REMOTE VIDEO */}
        <div className="w-[70%] h-[400px] bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {!isJoined && (
            <div className="absolute text-gray-400 text-sm">
              Waiting for participant...
            </div>
          )}
        </div>

        {/* LOCAL VIDEO */}
        <div className="w-[25%] h-[180px] bg-gray-800 rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <button
        onClick={handleEndCall}
        className="mt-6 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold"
      >
        End Call
      </button>
    </div>
  );
}
