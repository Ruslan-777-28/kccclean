export default function CallPage({ params }: { params: { callId: string } }) {
  return (
    <div style={{ padding: 40 }}>
      <h1>Call Page Loaded</h1>
      <p>Call ID: {params.callId}</p>
    </div>
  );
}
