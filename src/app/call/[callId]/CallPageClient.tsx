"use client";

import { useEffect, useRef } from "react";

export default function CallPageClient() {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    console.log("CallPageClient mounted");
  }, []);

  return (
    <div className="text-white p-10">
      <h1 className="text-2xl mb-4">Video Call</h1>

      <div className="flex gap-4">
        <video ref={localRef} autoPlay muted className="w-1/3 bg-gray-800" />
        <video ref={remoteRef} autoPlay className="w-2/3 bg-gray-900" />
      </div>
    </div>
  );
}
