import { NextResponse } from "next/server";

const ORG_ID = "93707c21-7290-442f-805d-583c2f05f395";
const BASIC_AUTH =
  "Basic OTM3MDdjMjEtNzI5MC00NDJmLTgwNWQtNTgzYzJmMDVmMzk1OjUwOWUwMDczOWRlYTk4NDE5Y2Yz";

export async function POST(req: Request) {
  try {
    const { presetHost, presetParticipant } = await req.json();

    // Create room
    const roomRes = await fetch(
      `https://api.realtime.cloudflare.com/v1/organizations/${ORG_ID}/rooms`,
      {
        method: "POST",
        headers: {
          Authorization: BASIC_AUTH,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          privacy: "private",
          max_participants: 2,
          auto_close: true,
        }),
      }
    );

    const room = await roomRes.json();

    if (!room?.id) {
      return NextResponse.json(
        { error: "Failed to create room", details: room },
        { status: 500 }
      );
    }

    // Create host token
    const hostTokenRes = await fetch(
      `https://api.realtime.cloudflare.com/v1/organizations/${ORG_ID}/rooms/${room.id}/tokens`,
      {
        method: "POST",
        headers: {
          Authorization: BASIC_AUTH,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preset: presetHost,
        }),
      }
    );

    const hostToken = await hostTokenRes.json();

    // Create participant token
    const participantTokenRes = await fetch(
      `https://api.realtime.cloudflare.com/v1/organizations/${ORG_ID}/rooms/${room.id}/tokens`,
      {
        method: "POST",
        headers: {
          Authorization: BASIC_AUTH,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preset: presetParticipant,
        }),
      }
    );

    const participantToken = await participantTokenRes.json();

    return NextResponse.json({
      roomId: room.id,
      hostToken: hostToken.token,
      participantToken: participantToken.token,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server Error", details: err.message },
      { status: 500 }
    );
  }
}
