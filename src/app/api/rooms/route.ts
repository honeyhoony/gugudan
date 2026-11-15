import { NextResponse } from "next/server";
import { createRoom } from "@/lib/rooms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      title?: string;
    };
    const room = await createRoom(body.title ?? "부서 행사");
    return NextResponse.json(room);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "방을 만들지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
