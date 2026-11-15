import { randomBytes } from "node:crypto";
import { sql } from "@/lib/db";
import { pickOxQuestion, pickTreasureClue, LADDER_RESULTS } from "@/lib/content";
import {
  buildMapping,
  generateBridges,
  pickResults,
} from "@/lib/ladder";
import {
  KWH_COUNTDOWN_MS,
  KWH_MAX_MS,
  KWH_TARGET,
  rankByTarget,
  readingAt,
} from "@/lib/kwh";
import {
  initialChallenge,
  MICRO_COUNTDOWN_MS,
  MICRO_DURATION_MS,
  newLeftRight,
  newMathOdd,
  newRps,
  rpsWins,
} from "@/lib/micro";
import {
  EVENT_FULL,
  PLAYER_STALE_MS,
  type GameMode,
  type KwhState,
  type LadderState,
  type MashState,
  type MicroId,
  type MicroState,
  type MoleState,
  type Player,
  type PublicRoom,
  type RoomState,
  type TreasureState,
} from "@/lib/types";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MODES: GameMode[] = [
  "lobby",
  "ox",
  "treasure",
  "ladder",
  "mash",
  "mole",
  "kwh",
  "micro",
];
const MICRO_IDS: MicroId[] = [
  "rub",
  "sprint",
  "ruler",
  "mathOdd",
  "leftRight",
  "rps",
  "order",
];
const MASH_COUNTDOWN_MS = 3000;
const MASH_PLAY_MS = 5000;
const MOLE_PLAY_MS = 12000;
const MOLE_SLOTS = 9;

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

function emptyTreasure(): TreasureState {
  return { phase: "idle", clue: "", spotId: "", guesses: {} };
}

function emptyLadder(): LadderState {
  return {
    phase: "idle",
    laneCount: 6,
    picks: {},
    bridges: [],
    results: [],
    mapping: {},
    runEndsAt: null,
  };
}

function emptyMash(): MashState {
  return { phase: "idle", endsAt: null, counts: {} };
}

function emptyMole(): MoleState {
  return {
    phase: "idle",
    endsAt: null,
    activeSlot: null,
    activeUntil: null,
    hits: {},
    slots: MOLE_SLOTS,
  };
}

function emptyKwh(): KwhState {
  return {
    phase: "idle",
    target: KWH_TARGET,
    endsAt: null,
    startedAt: null,
    stops: {},
  };
}

function emptyMicro(): MicroState {
  return {
    id: null,
    phase: "idle",
    endsAt: null,
    startedAt: null,
    scores: {},
    meta: {},
    challenge: {},
  };
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
    treasure: emptyTreasure(),
    ladder: emptyLadder(),
    mash: emptyMash(),
    mole: emptyMole(),
    kwh: emptyKwh(),
    micro: emptyMicro(),
  };
}

function normalizeState(raw: RoomState): RoomState {
  const base = emptyState(raw.title || EVENT_FULL);
  return {
    ...base,
    ...raw,
    ox: { ...base.ox, ...(raw.ox ?? {}) },
    treasure: { ...base.treasure, ...(raw.treasure ?? {}) },
    ladder: { ...base.ladder, ...(raw.ladder ?? {}) },
    mash: { ...base.mash, ...(raw.mash ?? {}) },
    mole: { ...base.mole, ...(raw.mole ?? {}) },
    kwh: { ...base.kwh, ...(raw.kwh ?? {}) },
    micro: { ...base.micro, ...(raw.micro ?? {}) },
    players: Array.isArray(raw.players) ? raw.players : [],
    mode: MODES.includes(raw.mode) ? raw.mode : "lobby",
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
  const parsed = typeof raw === "string" ? (JSON.parse(raw) as RoomState) : raw;
  return normalizeState(parsed);
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
  const state = emptyState(title.trim().slice(0, 40) || EVENT_FULL);
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

function maskKwhForViewer(
  state: RoomState,
  viewerId?: string | null,
): RoomState {
  if (state.mode !== "kwh" || state.kwh.phase !== "play") return state;
  const stops: Record<string, number> = {};
  for (const [pid, value] of Object.entries(state.kwh.stops)) {
    stops[pid] = viewerId && pid === viewerId ? value : -1;
  }
  return { ...state, kwh: { ...state.kwh, stops } };
}

function timedSignature(state: RoomState): string {
  return JSON.stringify({
    mode: state.mode,
    mash: state.mash,
    mole: {
      phase: state.mole.phase,
      endsAt: state.mole.endsAt,
      activeSlot: state.mole.activeSlot,
      activeUntil: state.mole.activeUntil,
      hits: state.mole.hits,
    },
    ladder: {
      phase: state.ladder.phase,
      runEndsAt: state.ladder.runEndsAt,
    },
    kwh: state.kwh,
    micro: state.micro,
  });
}

export async function getPublicRoom(
  code: string,
  viewerId?: string | null,
): Promise<PublicRoom | null> {
  const row = await getRow(code);
  if (!row) return null;
  const prev = prunePlayers(parseState(row.state));
  const next = advanceTimedState(prev);
  let state = next;
  if (timedSignature(prev) !== timedSignature(next)) {
    state = await saveState(row.code, next);
  }
  state = maskKwhForViewer(state, viewerId);
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

function resetModes(state: RoomState, mode: GameMode): RoomState {
  return {
    ...state,
    mode,
    ox: { phase: "idle", question: "", answer: "O", answers: {} },
    treasure: emptyTreasure(),
    ladder: emptyLadder(),
    mash: emptyMash(),
    mole: emptyMole(),
    kwh: emptyKwh(),
    micro: emptyMicro(),
  };
}

function finalizeKwh(state: RoomState): RoomState {
  const ranked = rankByTarget(state.kwh.stops, state.kwh.target);
  let next: RoomState = {
    ...state,
    kwh: {
      ...state.kwh,
      phase: "reveal",
      endsAt: null,
    },
  };
  if (ranked[0]) {
    next = bumpScore(next, ranked[0].playerId, 2);
    if (ranked[0].badge === "perfect") {
      next = bumpScore(next, ranked[0].playerId, 1);
    }
  }
  if (ranked[1]) next = bumpScore(next, ranked[1].playerId, 1);
  return next;
}

function awardTopTapScores(
  state: RoomState,
  counts: Record<string, number>,
): RoomState {
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  let next = state;
  if (ranked[0] && ranked[0][1] > 0) next = bumpScore(next, ranked[0][0], 2);
  if (ranked[1] && ranked[1][1] > 0) next = bumpScore(next, ranked[1][0], 1);
  return next;
}

function spawnMole(state: RoomState): RoomState {
  const prev = state.mole.activeSlot;
  let slot = Math.floor(Math.random() * state.mole.slots);
  if (state.mole.slots > 1) {
    for (let i = 0; i < 6 && slot === prev; i++) {
      slot = Math.floor(Math.random() * state.mole.slots);
    }
  }
  return {
    ...state,
    mole: {
      ...state.mole,
      activeSlot: slot,
      activeUntil: now() + 750 + Math.floor(Math.random() * 550),
    },
  };
}

function advanceTimedState(state: RoomState): RoomState {
  if (
    state.mode === "ladder" &&
    state.ladder.phase === "running" &&
    state.ladder.runEndsAt &&
    now() >= state.ladder.runEndsAt
  ) {
    let next: RoomState = {
      ...state,
      ladder: { ...state.ladder, phase: "result", runEndsAt: null },
    };
    for (const [pid, lane] of Object.entries(state.ladder.picks)) {
      const end = state.ladder.mapping[lane];
      if (end == null) continue;
      const label = state.ladder.results[end] ?? "";
      if (label.includes("+1")) next = bumpScore(next, pid, 1);
    }
    return next;
  }

  if (state.mode === "mash" && state.mash.endsAt && now() >= state.mash.endsAt) {
    if (state.mash.phase === "countdown") {
      return {
        ...state,
        mash: {
          ...state.mash,
          phase: "play",
          endsAt: now() + MASH_PLAY_MS,
          counts: {},
        },
      };
    }
    if (state.mash.phase === "play") {
      const finished = {
        ...state,
        mash: { ...state.mash, phase: "result" as const, endsAt: null },
      };
      return awardTopTapScores(finished, state.mash.counts);
    }
  }

  if (state.mode === "mole" && state.mole.phase === "play") {
    let next = state;
    if (state.mole.endsAt && now() >= state.mole.endsAt) {
      const finished = {
        ...next,
        mole: {
          ...next.mole,
          phase: "result" as const,
          endsAt: null,
          activeSlot: null,
          activeUntil: null,
        },
      };
      return awardTopTapScores(finished, state.mole.hits);
    }
    if (
      next.mole.activeSlot == null ||
      (next.mole.activeUntil != null && now() >= next.mole.activeUntil)
    ) {
      next = spawnMole(next);
    }
    return next;
  }

  if (state.mode === "kwh") {
    if (
      state.kwh.phase === "countdown" &&
      state.kwh.endsAt &&
      now() >= state.kwh.endsAt
    ) {
      const start = now();
      return {
        ...state,
        kwh: {
          ...state.kwh,
          phase: "play",
          startedAt: start,
          endsAt: start + KWH_MAX_MS,
          stops: {},
        },
      };
    }
    if (state.kwh.phase === "play") {
      let next = state;
      // 미정지 선수 자동 마감
      if (state.kwh.endsAt && now() >= state.kwh.endsAt && state.kwh.startedAt) {
        const stops = { ...state.kwh.stops };
        const auto = readingAt(state.kwh.startedAt, state.kwh.endsAt);
        for (const p of state.players) {
          if (stops[p.id] == null) stops[p.id] = auto;
        }
        next = { ...state, kwh: { ...state.kwh, stops } };
        return finalizeKwh(next);
      }
      const allIn =
        state.players.length > 0 &&
        state.players.every((p) => state.kwh.stops[p.id] != null);
      if (allIn) return finalizeKwh(state);
      return next;
    }
  }

  if (state.mode === "micro" && state.micro.id) {
    const microId = state.micro.id;
    const m = state.micro;
    if (m.phase === "countdown" && m.endsAt && now() >= m.endsAt) {
      const start = now();
      const dur = MICRO_DURATION_MS[microId];
      let challenge = initialChallenge(microId);
      if (microId === "ruler") {
        const delay = 1500 + Math.floor(Math.random() * 2500);
        challenge = { goAt: start + delay };
      }
      return {
        ...state,
        micro: {
          ...m,
          phase: "play",
          startedAt: start,
          endsAt: dur > 0 ? start + dur : null,
          scores: {},
          meta: {},
          challenge,
        },
      };
    }
    if (m.phase === "play") {
      // ruler: wait for go — no auto end until catch or timeout 8s after go
      if (microId === "ruler") {
        const goAt = Number(m.challenge.goAt ?? 0);
        if (goAt && now() > goAt + 8000) {
          return finalizeMicro(state);
        }
        return state;
      }
      if (m.endsAt && now() >= m.endsAt) {
        return finalizeMicro(state);
      }
    }
  }

  return state;
}

function finalizeMicro(state: RoomState): RoomState {
  const ranked = Object.entries(state.micro.scores).sort((a, b) => b[1] - a[1]);
  let next: RoomState = {
    ...state,
    micro: { ...state.micro, phase: "result", endsAt: null },
  };
  if (ranked[0] && ranked[0][1] > 0) next = bumpScore(next, ranked[0][0], 2);
  if (ranked[1] && ranked[1][1] > 0) next = bumpScore(next, ranked[1][0], 1);
  return next;
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
      const mode = String(payload.mode) as GameMode;
      if (!MODES.includes(mode)) {
        throw new BadRequestError("알 수 없는 모드입니다.");
      }
      state = resetModes(state, mode);
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
    case "treasureStart": {
      const custom = String(payload.clue ?? "").trim();
      const spotId = String(payload.spotId ?? "").trim();
      const picked =
        custom.length > 0 && spotId
          ? { clue: custom.slice(0, 100), spotId }
          : pickTreasureClue();
      state = {
        ...state,
        mode: "treasure",
        treasure: {
          phase: "clue",
          clue: picked.clue,
          spotId: picked.spotId,
          guesses: {},
        },
      };
      break;
    }
    case "treasureReveal": {
      if (state.treasure.phase !== "clue") {
        throw new BadRequestError("진행 중인 보물찾기가 없습니다.");
      }
      let next: RoomState = {
        ...state,
        treasure: { ...state.treasure, phase: "reveal" },
      };
      for (const [pid, guess] of Object.entries(state.treasure.guesses)) {
        if (guess === state.treasure.spotId) next = bumpScore(next, pid, 1);
      }
      state = next;
      break;
    }
    case "treasureReset": {
      state = { ...state, treasure: emptyTreasure() };
      break;
    }
    case "ladderOpen": {
      if (state.players.length < 2) {
        throw new BadRequestError("선수가 2명 이상 필요합니다.");
      }
      const laneCount = Math.min(
        8,
        Math.max(2, Number(payload.laneCount) || Math.min(6, state.players.length)),
      );
      state = {
        ...state,
        mode: "ladder",
        ladder: {
          ...emptyLadder(),
          phase: "picking",
          laneCount,
        },
      };
      break;
    }
    case "ladderRun": {
      if (state.ladder.phase !== "picking") {
        throw new BadRequestError("먼저 레인 선택을 열어 주세요.");
      }
      const picks = Object.keys(state.ladder.picks).length;
      if (picks < 1) {
        throw new BadRequestError("레인에 선수가 없습니다.");
      }
      const bridges = generateBridges(state.ladder.laneCount, 11);
      const mapping = buildMapping(state.ladder.laneCount, bridges);
      const results = pickResults(state.ladder.laneCount, LADDER_RESULTS);
      state = {
        ...state,
        ladder: {
          ...state.ladder,
          phase: "running",
          bridges,
          mapping,
          results,
          runEndsAt: now() + 3800,
        },
      };
      break;
    }
    case "ladderReset": {
      state = { ...state, ladder: emptyLadder() };
      break;
    }
    case "mashStart": {
      if (state.players.length < 1) {
        throw new BadRequestError("선수가 필요합니다.");
      }
      state = {
        ...state,
        mode: "mash",
        mash: {
          phase: "countdown",
          endsAt: now() + MASH_COUNTDOWN_MS,
          counts: {},
        },
      };
      break;
    }
    case "mashReset": {
      state = { ...state, mash: emptyMash() };
      break;
    }
    case "moleStart": {
      if (state.players.length < 1) {
        throw new BadRequestError("선수가 필요합니다.");
      }
      state = spawnMole({
        ...state,
        mode: "mole",
        mole: {
          phase: "play",
          endsAt: now() + MOLE_PLAY_MS,
          activeSlot: null,
          activeUntil: null,
          hits: {},
          slots: MOLE_SLOTS,
        },
      });
      break;
    }
    case "moleReset": {
      state = { ...state, mole: emptyMole() };
      break;
    }
    case "kwhStart": {
      if (state.players.length < 1) {
        throw new BadRequestError("선수가 필요합니다.");
      }
      state = {
        ...state,
        mode: "kwh",
        kwh: {
          phase: "countdown",
          target: KWH_TARGET,
          endsAt: now() + KWH_COUNTDOWN_MS,
          startedAt: null,
          stops: {},
        },
      };
      break;
    }
    case "kwhReveal": {
      if (state.kwh.phase !== "play") {
        throw new BadRequestError("계측 중이 아닙니다.");
      }
      if (Object.keys(state.kwh.stops).length < 1) {
        throw new BadRequestError("아직 STOP한 선수가 없습니다.");
      }
      // 미정지 선수는 현재 전력으로 강제 마감
      const stops = { ...state.kwh.stops };
      if (state.kwh.startedAt) {
        const cur = readingAt(state.kwh.startedAt);
        for (const p of state.players) {
          if (stops[p.id] == null) stops[p.id] = cur;
        }
      }
      state = finalizeKwh({
        ...state,
        kwh: { ...state.kwh, stops },
      });
      break;
    }
    case "kwhReset": {
      state = { ...state, kwh: emptyKwh() };
      break;
    }
    case "microStart": {
      const id = String(payload.id) as MicroId;
      if (!MICRO_IDS.includes(id)) {
        throw new BadRequestError("알 수 없는 미니게임입니다.");
      }
      if (state.players.length < 1) {
        throw new BadRequestError("선수가 필요합니다.");
      }
      state = {
        ...resetModes(state, "micro"),
        mode: "micro",
        micro: {
          id,
          phase: "countdown",
          endsAt: now() + MICRO_COUNTDOWN_MS,
          startedAt: null,
          scores: {},
          meta: {},
          challenge: {},
        },
      };
      break;
    }
    case "microReset": {
      state = { ...state, micro: emptyMicro(), mode: "lobby" };
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
    case "treasureGuess": {
      if (state.mode !== "treasure" || state.treasure.phase !== "clue") {
        throw new BadRequestError("지금은 고를 수 없습니다.");
      }
      if (state.treasure.guesses[playerId]) {
        throw new BadRequestError("이미 위치를 골랐습니다.");
      }
      const spotId = String(payload.spotId ?? "");
      if (!spotId) throw new BadRequestError("위치를 골라 주세요.");
      state = {
        ...state,
        treasure: {
          ...state.treasure,
          guesses: { ...state.treasure.guesses, [playerId]: spotId },
        },
      };
      break;
    }
    case "ladderPick": {
      if (state.mode !== "ladder" || state.ladder.phase !== "picking") {
        throw new BadRequestError("지금은 레인을 고를 수 없습니다.");
      }
      const lane = Number(payload.lane);
      if (
        !Number.isInteger(lane) ||
        lane < 0 ||
        lane >= state.ladder.laneCount
      ) {
        throw new BadRequestError("잘못된 레인입니다.");
      }
      const taken = Object.entries(state.ladder.picks).find(
        ([pid, l]) => l === lane && pid !== playerId,
      );
      if (taken) throw new BadRequestError("이미 선택된 레인입니다.");
      state = {
        ...state,
        ladder: {
          ...state.ladder,
          picks: { ...state.ladder.picks, [playerId]: lane },
        },
      };
      break;
    }
    case "mashTap": {
      state = advanceTimedState(state);
      if (state.mode !== "mash" || state.mash.phase !== "play") {
        throw new BadRequestError("지금은 연타할 수 없습니다.");
      }
      const add = Math.min(40, Math.max(1, Number(payload.count) || 1));
      state = {
        ...state,
        mash: {
          ...state.mash,
          counts: {
            ...state.mash.counts,
            [playerId]: (state.mash.counts[playerId] ?? 0) + add,
          },
        },
      };
      break;
    }
    case "moleHit": {
      state = advanceTimedState(state);
      if (state.mode !== "mole" || state.mole.phase !== "play") {
        throw new BadRequestError("지금은 두드릴 수 없습니다.");
      }
      const slot = Number(payload.slot);
      if (!Number.isInteger(slot) || slot !== state.mole.activeSlot) {
        break;
      }
      state = spawnMole({
        ...state,
        mole: {
          ...state.mole,
          hits: {
            ...state.mole.hits,
            [playerId]: (state.mole.hits[playerId] ?? 0) + 1,
          },
          activeSlot: null,
          activeUntil: null,
        },
      });
      break;
    }
    case "kwhStop": {
      state = advanceTimedState(state);
      if (state.mode !== "kwh" || state.kwh.phase !== "play") {
        throw new BadRequestError("지금은 차단할 수 없습니다.");
      }
      if (!state.kwh.startedAt) {
        throw new BadRequestError("계측이 시작되지 않았습니다.");
      }
      if (state.kwh.stops[playerId] != null) {
        throw new BadRequestError("이미 STOP 했습니다.");
      }
      const value = readingAt(state.kwh.startedAt);
      state = {
        ...state,
        kwh: {
          ...state.kwh,
          stops: { ...state.kwh.stops, [playerId]: value },
        },
      };
      const allIn =
        state.players.length > 0 &&
        state.players.every((p) => state.kwh.stops[p.id] != null);
      if (allIn) state = finalizeKwh(state);
      break;
    }
    case "microAction": {
      state = advanceTimedState(state);
      if (state.mode !== "micro" || state.micro.phase !== "play" || !state.micro.id) {
        throw new BadRequestError("지금은 플레이할 수 없습니다.");
      }
      const type = String(payload.type ?? "");
      const id = state.micro.id;
      const addScore = (n: number) => {
        state = {
          ...state,
          micro: {
            ...state.micro,
            scores: {
              ...state.micro.scores,
              [playerId]: (state.micro.scores[playerId] ?? 0) + n,
            },
          },
        };
      };

      if (id === "rub" && type === "rub") {
        const n = Math.min(40, Math.max(1, Number(payload.count) || 1));
        addScore(n);
        break;
      }

      if (id === "sprint" && type === "step") {
        const side = String(payload.side);
        if (side !== "L" && side !== "R") break;
        const lastKey = `sprint:${playerId}`;
        const last = String(state.micro.meta[lastKey] ?? "");
        if (last === side) break;
        state = {
          ...state,
          micro: {
            ...state.micro,
            meta: { ...state.micro.meta, [lastKey]: side },
            scores: {
              ...state.micro.scores,
              [playerId]: (state.micro.scores[playerId] ?? 0) + 1,
            },
          },
        };
        break;
      }

      if (id === "ruler" && type === "catch") {
        if (state.micro.scores[playerId] != null) break;
        const goAt = Number(state.micro.challenge.goAt ?? 0);
        if (!goAt || now() < goAt) break; // early = ignore
        const ms = now() - goAt;
        const points = Math.max(0, 2000 - ms);
        state = {
          ...state,
          micro: {
            ...state.micro,
            scores: { ...state.micro.scores, [playerId]: points },
          },
        };
        const allCaught =
          state.players.length > 0 &&
          state.players.every((p) => state.micro.scores[p.id] != null);
        if (allCaught) state = finalizeMicro(state);
        break;
      }

      if (id === "mathOdd" && type === "answer") {
        const odd = Boolean(payload.odd);
        const expect = Boolean(state.micro.challenge.odd);
        if (odd === expect) {
          addScore(1);
          state = {
            ...state,
            micro: { ...state.micro, challenge: newMathOdd() },
          };
        } else {
          state = {
            ...state,
            micro: { ...state.micro, challenge: newMathOdd() },
          };
        }
        break;
      }

      if (id === "leftRight" && type === "side") {
        const side = String(payload.side);
        const expect = String(state.micro.challenge.correct);
        if (side === expect) {
          addScore(1);
          state = {
            ...state,
            micro: { ...state.micro, challenge: newLeftRight() },
          };
        } else {
          state = {
            ...state,
            micro: { ...state.micro, challenge: newLeftRight() },
          };
        }
        break;
      }

      if (id === "rps" && type === "hand") {
        const hand = String(payload.hand) as "가위" | "바위" | "보";
        if (!["가위", "바위", "보"].includes(hand)) break;
        const cpu = String(state.micro.challenge.cpu) as "가위" | "바위" | "보";
        const goal = String(state.micro.challenge.goal);
        const won = rpsWins(hand, cpu);
        const ok =
          (goal === "이기기" && won) ||
          (goal === "지기" && !won && hand !== cpu);
        if (ok) addScore(1);
        state = {
          ...state,
          micro: { ...state.micro, challenge: newRps() },
        };
        break;
      }

      if (id === "order" && type === "finish") {
        if (state.micro.scores[playerId] != null) break;
        const ms = Math.max(0, Number(payload.ms) || 60000);
        const points = Math.max(0, 100000 - ms);
        state = {
          ...state,
          micro: {
            ...state.micro,
            scores: { ...state.micro.scores, [playerId]: points },
          },
        };
        break;
      }

      throw new BadRequestError("알 수 없는 미니 동작입니다.");
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
