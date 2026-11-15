import { NextResponse } from "next/server";
import { BadRequestError, joinRoom, NotFoundError } from "@/lib/rooms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ code: string }> };

export async function POST(request: Request, context: Ctx) {
  const { code } = await context.params;
  try {
    const body = (await request.json().catch(() => ({}))) as { name?: string };
    const result = await joinRoom(code, body.name ?? "");
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof BadRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message =
      error instanceof Error ? error.message : "입장에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
