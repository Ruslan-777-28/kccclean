
import { headers } from "next/headers";
import CallPageClient from "./CallPageClient";
import LoadingScreen from "@/components/LoadingScreen";

// Helper function to get the base URL
function getBaseUrl() {
  const host = headers().get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  return `${protocol}://${host}`;
}

async function getTokenAndRoom() {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/videosdk-token`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Failed to fetch token: ${res.statusText}`);
    }
    const data = await res.json();
    return { token: data.token, roomId: data.roomId };
  } catch (error) {
    console.error("Error fetching VideoSDK token and room:", error);
    return { token: null, roomId: null };
  }
}

export default async function CallPage({ params }: { params: { callId: string } }) {
  // The callId from params is the document ID in Firestore.
  // We will now create a new meetingId/roomId via the API.
  const { token, roomId } = await getTokenAndRoom();

  if (!token || !roomId) {
    return <LoadingScreen message="Помилка підключення... Не вдалося отримати токен." />;
  }

  return <CallPageClient token={token} meetingId={roomId} />;
}
