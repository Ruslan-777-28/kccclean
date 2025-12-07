"use client";

import dynamic from "next/dynamic";

// Dynamically import CallPage where VideoSDK is used
const CallPageClient = dynamic(() => import("./CallPage"), {
  ssr: false,
});

export default function CallPageWrapper({ callId }: { callId:string }) {
  return <CallPageClient callId={callId} />;
}
