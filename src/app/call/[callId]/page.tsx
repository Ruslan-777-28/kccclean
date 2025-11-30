import dynamic from "next/dynamic";

const CallPageClient = dynamic(
  () => import("./CallPageClient"),
  { ssr: false }
);

export default function Page({ params }: { params: { callId: string } }) {
  return <CallPageClient callId={params.callId} />;
}
