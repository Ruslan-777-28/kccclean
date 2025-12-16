
import CallPageClient from "./CallPageClient";

export default function CallPage({ params }: { params: { roomId: string } }) {
  // We use `roomId` as the meetingId for VideoSDK
  return <CallPageClient meetingId={params.roomId} />;
}
