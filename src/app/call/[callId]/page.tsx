import CallPageWrapper from "@/app/call/[callId]/CallPageWrapper";

export default function Page({ params }: { params: { callId: string } }) {
  return <CallPageWrapper callId={params.callId} />;
}
