
"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
// This file is being replaced by CallPageClient.tsx for VideoSDK.
// It is left here with minimal content to avoid breaking the build process if referenced somewhere.
// The logic has been moved to CallPageClient.tsx.
export default function RealtimeCallClient({ roomId }: { roomId: string }) {
  return <div>Loading call...</div>;
}

