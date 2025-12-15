import { NextResponse } from "next/server";

const ORG_ID = process.env.CLOUDFLARE_ORG_ID!;
const BASIC_AUTH = process.env.CLOUDFLARE_BASIC_AUTH!;

export async function POST(req: Request) {
  try {
    const { presetHost, presetParticipant } = await req.json();

    const createRoom = await fetch(
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

    const room = await createRoom.json();
    if (!room?.id) {
      return NextResponse.json({ error: "room creation failed", room }, { status: 500 });
    }

    const createToken = async (preset: any) => {
      const r = await fetch(
        `https://api.realtime.cloudflare.com/v1/organizations/${ORG_ID}/rooms/${room.id}/tokens`,
        {
          method: "POST",
          headers: {
            Authorization: BASIC_AUTH,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ preset }),
        }
      );
      return r.json();
    };

    const hostToken = await createToken(presetHost);
    const participantToken = await createToken(presetParticipant);

    return NextResponse.json({
      roomId: room.id,
      hostToken: hostToken.token,
      participantToken: participantToken.token,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
