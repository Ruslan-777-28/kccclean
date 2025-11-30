import dynamic from "next/dynamic";

const CallClient = dynamic(
  () => import("./CallClient"), 
  { ssr: false }
);

export default function Page({ params }: { params: { callId: string } }) {
  return <CallClient callId={params.callId} />;
}
