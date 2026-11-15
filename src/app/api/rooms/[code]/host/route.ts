import { NextResponse } from "next/server";
import {
  AuthError,
  BadRequestError,
  hostAction,
  NotFoundError,
} from "@/lib/rooms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ code: string }> };

export async function POST(request: Request, context: Ctx) {
  const { code } = await context.params;
  try {
    const body = (await request.json().catch(() => ({}))) as {
      hostKey?: string;
      action?: string;
      payload?: Record<string, unknown>;
    };
    if (!body.hostKey || !body.action) {
      return NextResponse.json(
        { error: "hostKey와 action이 필요합니다." },
        { status: 400 },
      );
    }
    const state = await hostAction(
      code,
      body.hostKey,
      body.action,
      body.payload ?? {},
    );
    return NextResponse.json({ state });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof BadRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message =
      error instanceof Error ? error.message : "요청을 처리하지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
