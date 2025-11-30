"use client";

import React from "react";
import CallPage from "./CallPage"; 

export default function CallPageClient({
  callId,
}: {
  callId: string;
}) {
  return <CallPage callId={callId} />;
}
