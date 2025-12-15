import RealtimeCallClient from './RealtimeCallClient';

export default function RealtimeCallPage({ params }: { params: { roomId: string } }) {
  // We pass the roomId from the URL to the client component.
  // The client will handle fetching tokens and connecting to the Cloudflare Realtime room.
  return <RealtimeCallClient roomId={params.roomId} />;
}
