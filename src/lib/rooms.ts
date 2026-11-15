import { randomBytes } from "node:crypto";
import { sql } from "@/lib/db";
import { pickOxQuestion } from "@/lib/questions";
import {
  PLAYER_STALE_MS,
  type Player,
  type PublicRoom,
  type RoomState,
} from "@/lib/types";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function now() {
  return Date.now();
}

export function createCode(length = 4): string {
  let out = "";
  const bytes = randomBytes(length);
  for (let i = 0; i < length; i++) {
    out += CODE_CHARS[bytes[i]! % CODE_CHARS.length];
  }
  return out;
}

export function createHostKey(): string {
  return randomBytes(18).toString("hex");
}

export function createPlayerId(): string {
  return randomBytes(12).toString("hex");
}

export function emptyState(title: string): RoomState {
  return {
    title,
    mode: "lobby",
    players: [],
    ox: {
      phase: "idle",
      question: "",
      answer: "O",
      answers: {},
    },
    random: {
      phase: "idle",
      winnerId: null,
      spinEndsAt: null,
    },
    reaction: {
      phase: "idle",
      goAt: null,
      taps: {},
      winnerId: null,
    },
  };
}

function prunePlayers(state: RoomState): RoomState {
  const cutoff = now() - PLAYER_STALE_MS;
  return {
    ...state,
    players: state.players.filter((p) => p.lastSeen >= cutoff),
  };
}

type RoomRow = {
  code: string;
  host_key: string;
  state: RoomState | string;
  updated_at: string | Date;
};

function parseState(raw: RoomState | string): RoomState {
  if (typeof raw === "string") return JSON.parse(raw) as RoomState;
  return raw;
}

async function getRow(code: string): Promise<RoomRow | null> {
  const rows = await sql<RoomRow>(
    "select code, host_key, state, updated_at from rooms where code = $1",
    [code.toUpperCase()],
  );
  return rows[0] ?? null;
}

export async function createRoom(title: string): Promise<{
  code: string;
  hostKey: string;
  state: RoomState;
}> {
  await cleanupOldRooms();
  const hostKey = createHostKey();
  const state = emptyState(title.trim().slice(0, 40) || "부서 행사");
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = createCode();
    try {
      await sql(
        "insert into rooms (code, host_key, state) values ($1, $2, $3::jsonb)",
        [code, hostKey, JSON.stringify(state)],
      );
      return { code, hostKey, state };
    } catch {
      // code collision — retry
    }
  }
  throw new Error("방 코드를 만들지 못했습니다. 다시 시도해 주세요.");
}

export async function getPublicRoom(code: string): Promise<PublicRoom | null> {
  const row = await getRow(code);
  if (!row) return null;
  let state = prunePlayers(parseState(row.state));
  state = advanceTimedState(state);
  const updatedAt =
    typeof row.updated_at === "string"
      ? row.updated_at
      : row.updated_at.toISOString();
  return { code: row.code, state, updatedAt };
}

export async function assertHost(code: string, hostKey: string): Promise<RoomRow> {
  const row = await getRow(code);
  if (!row || row.host_key !== hostKey) {
    throw new AuthError("진행자 권한이 없습니다.");
  }
  return row;
}

export async function saveState(code: string, state: RoomState): Promise<RoomState> {
  const next = prunePlayers(state);
  await sql(
    "update rooms set state = $2::jsonb, updated_at = now() where code = $1",
    [code.toUpperCase(), JSON.stringify(next)],
  );
  return next;
}

export async function joinRoom(
  code: string,
  name: string,
): Promise<{ player: Player; state: RoomState }> {
  const row = await getRow(code);
  if (!row) throw new NotFoundError("방을 찾을 수 없습니다.");
  let state = prunePlayers(parseState(row.state));
  const clean = name.trim().slice(0, 12);
  if (clean.length < 1) throw new BadRequestError("닉네임을 입력해 주세요.");
  if (state.players.length >= 80) {
    throw new BadRequestError("인원이 가득 찼습니다.");
  }
  const player: Player = {
    id: createPlayerId(),
    name: clean,
    score: 0,
    joinedAt: now(),
    lastSeen: now(),
  };
  state = { ...state, players: [...state.players, player] };
  await saveState(row.code, state);
  return { player, state };
}

export async function touchPlayer(
  code: string,
  playerId: string,
): Promise<RoomState | null> {
  const row = await getRow(code);
  if (!row) return null;
  let state = prunePlayers(parseState(row.state));
  const idx = state.players.findIndex((p) => p.id === playerId);
  if (idx < 0) return state;
  const players = state.players.slice();
  players[idx] = { ...players[idx]!, lastSeen: now() };
  state = advanceTimedState({ ...state, players });
  await saveState(row.code, state);
  return state;
}

function bumpScore(state: RoomState, playerId: string, delta: number): RoomState {
  return {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId ? { ...p, score: p.score + delta } : p,
    ),
  };
}

function advanceTimedState(state: RoomState): RoomState {
  if (
    state.mode === "random" &&
    state.random.phase === "spinning" &&
    state.random.spinEndsAt &&
    now() >= state.random.spinEndsAt
  ) {
    return {
      ...state,
      random: {
        ...state.random,
        phase: "result",
        spinEndsAt: null,
      },
    };
  }
  if (
    state.mode === "reaction" &&
    state.reaction.phase === "wait" &&
    state.reaction.goAt &&
    now() >= state.reaction.goAt
  ) {
    return {
      ...state,
      reaction: {
        ...state.reaction,
        phase: "go",
      },
    };
  }
  return state;
}

export async function hostAction(
  code: string,
  hostKey: string,
  action: string,
  payload: Record<string, unknown> = {},
): Promise<RoomState> {
  const row = await assertHost(code, hostKey);
  let state = advanceTimedState(prunePlayers(parseState(row.state)));

  switch (action) {
    case "setTitle": {
      const title = String(payload.title ?? "").trim().slice(0, 40);
      state = { ...state, title: title || state.title };
      break;
    }
    case "setMode": {
      const mode = String(payload.mode);
      if (!["lobby", "ox", "random", "reaction"].includes(mode)) {
        throw new BadRequestError("알 수 없는 모드입니다.");
      }
      state = {
        ...state,
        mode: mode as RoomState["mode"],
        ox: { phase: "idle", question: "", answer: "O", answers: {} },
        random: { phase: "idle", winnerId: null, spinEndsAt: null },
        reaction: { phase: "idle", goAt: null, taps: {}, winnerId: null },
      };
      break;
    }
    case "oxStart": {
      const custom = String(payload.question ?? "").trim();
      const answerRaw = String(payload.answer ?? "").toUpperCase();
      const picked =
        custom.length > 0
          ? {
              question: custom.slice(0, 80),
              answer: (answerRaw === "X" ? "X" : "O") as "O" | "X",
            }
          : pickOxQuestion();
      state = {
        ...state,
        mode: "ox",
        ox: {
          phase: "question",
          question: picked.question,
          answer: picked.answer,
          answers: {},
        },
      };
      break;
    }
    case "oxReveal": {
      if (state.ox.phase !== "question") {
        throw new BadRequestError("진행 중인 문제가 없습니다.");
      }
      let next: RoomState = {
        ...state,
        ox: { ...state.ox, phase: "reveal" },
      };
      for (const [pid, ans] of Object.entries(state.ox.answers)) {
        if (ans === state.ox.answer) next = bumpScore(next, pid, 1);
      }
      state = next;
      break;
    }
    case "oxReset": {
      state = {
        ...state,
        ox: { phase: "idle", question: "", answer: "O", answers: {} },
      };
      break;
    }
    case "randomSpin": {
      if (state.players.length < 1) {
        throw new BadRequestError("참가자가 없습니다.");
      }
      const winner =
        state.players[Math.floor(Math.random() * state.players.length)]!;
      state = {
        ...state,
        mode: "random",
        random: {
          phase: "spinning",
          winnerId: winner.id,
          spinEndsAt: now() + 3200,
        },
      };
      break;
    }
    case "randomClear": {
      state = {
        ...state,
        random: { phase: "idle", winnerId: null, spinEndsAt: null },
      };
      break;
    }
    case "reactionArm": {
      const delay = 1800 + Math.floor(Math.random() * 3500);
      state = {
        ...state,
        mode: "reaction",
        reaction: {
          phase: "wait",
          goAt: now() + delay,
          taps: {},
          winnerId: null,
        },
      };
      break;
    }
    case "reactionReset": {
      state = {
        ...state,
        reaction: { phase: "idle", goAt: null, taps: {}, winnerId: null },
      };
      break;
    }
    case "kick": {
      const playerId = String(payload.playerId ?? "");
      state = {
        ...state,
        players: state.players.filter((p) => p.id !== playerId),
      };
      break;
    }
    case "resetScores": {
      state = {
        ...state,
        players: state.players.map((p) => ({ ...p, score: 0 })),
      };
      break;
    }
    default:
      throw new BadRequestError("알 수 없는 동작입니다.");
  }

  return saveState(row.code, state);
}

export async function playAction(
  code: string,
  playerId: string,
  action: string,
  payload: Record<string, unknown> = {},
): Promise<RoomState> {
  const row = await getRow(code);
  if (!row) throw new NotFoundError("방을 찾을 수 없습니다.");
  let state = advanceTimedState(prunePlayers(parseState(row.state)));
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new AuthError("참가 정보가 없습니다. 다시 들어와 주세요.");

  state = {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId ? { ...p, lastSeen: now() } : p,
    ),
  };

  switch (action) {
    case "oxAnswer": {
      if (state.mode !== "ox" || state.ox.phase !== "question") {
        throw new BadRequestError("지금은 답할 수 없습니다.");
      }
      if (state.ox.answers[playerId]) {
        throw new BadRequestError("이미 답을 골랐습니다.");
      }
      const answer = String(payload.answer ?? "").toUpperCase();
      if (answer !== "O" && answer !== "X") {
        throw new BadRequestError("O 또는 X만 가능합니다.");
      }
      state = {
        ...state,
        ox: {
          ...state.ox,
          answers: { ...state.ox.answers, [playerId]: answer },
        },
      };
      break;
    }
    case "reactionTap": {
      state = advanceTimedState(state);
      if (state.mode !== "reaction") {
        throw new BadRequestError("순발력 게임이 아닙니다.");
      }
      if (state.reaction.phase === "wait") {
        // early tap — ignore scoring, keep waiting
        break;
      }
      if (state.reaction.phase !== "go") {
        throw new BadRequestError("지금은 누를 수 없습니다.");
      }
      if (state.reaction.taps[playerId]) break;
      const tappedAt = now();
      const taps = { ...state.reaction.taps, [playerId]: tappedAt };
      const isFirst = !state.reaction.winnerId;
      state = {
        ...state,
        reaction: {
          ...state.reaction,
          taps,
          winnerId: isFirst ? playerId : state.reaction.winnerId,
          phase: isFirst ? "result" : state.reaction.phase,
        },
      };
      if (isFirst) state = bumpScore(state, playerId, 1);
      break;
    }
    default:
      throw new BadRequestError("알 수 없는 동작입니다.");
  }

  return saveState(row.code, state);
}

async function cleanupOldRooms() {
  await sql("delete from rooms where updated_at < now() - interval '6 hours'");
}

export class AuthError extends Error {}
export class NotFoundError extends Error {}
export class BadRequestError extends Error {}
