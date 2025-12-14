import CallPageClient from "./CallPageClient";

export default function CallPage({ params }: { params: { callId: string } }) {
  // The callId from the URL is used as the meetingId for VideoSDK.
  // The client component will handle fetching the token and initializing the meeting.
  return <CallPageClient meetingId={params.callId} />;
}
