import { NextResponse } from "next/server";
import { getPublicRoom, touchPlayer } from "@/lib/rooms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(request: Request, context: Ctx) {
  const { code } = await context.params;
  const url = new URL(request.url);
  const playerId = url.searchParams.get("playerId");
  if (playerId) {
    await touchPlayer(code, playerId);
  }
  const room = await getPublicRoom(code);
  if (!room) {
    return NextResponse.json({ error: "방을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json(room, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
