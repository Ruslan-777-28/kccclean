import { Video } from 'lucide-react';
import React from 'react';

export default function Logo() {
  return (
    <div className="flex items-center gap-2 text-primary">
      <Video className="h-7 w-7" />
      <span className="text-xl font-headline font-bold">ConnectNow</span>
    </div>
  );
}
