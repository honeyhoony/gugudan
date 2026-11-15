export type GameMode = "lobby" | "ox" | "random" | "reaction";

export type Player = {
  id: string;
  name: string;
  score: number;
  joinedAt: number;
  lastSeen: number;
};

export type OxPhase = "idle" | "question" | "reveal";
export type RandomPhase = "idle" | "spinning" | "result";
export type ReactionPhase = "idle" | "wait" | "go" | "result";

export type OxState = {
  phase: OxPhase;
  question: string;
  answer: "O" | "X";
  answers: Record<string, "O" | "X">;
};

export type RandomState = {
  phase: RandomPhase;
  winnerId: string | null;
  spinEndsAt: number | null;
};

export type ReactionState = {
  phase: ReactionPhase;
  goAt: number | null;
  taps: Record<string, number>;
  winnerId: string | null;
};

export type RoomState = {
  title: string;
  mode: GameMode;
  players: Player[];
  ox: OxState;
  random: RandomState;
  reaction: ReactionState;
};

export type PublicRoom = {
  code: string;
  state: RoomState;
  updatedAt: string;
};

export type HostCreateResponse = {
  code: string;
  hostKey: string;
  state: RoomState;
};

export const ROOM_TTL_MS = 1000 * 60 * 60 * 6;
export const PLAYER_STALE_MS = 1000 * 60 * 5;

/** 행사 기본 표기 */
export const EVENT_ORG = "대구본부 에너지효율부";
export const EVENT_NAME = "온라인 체육대회";
export const EVENT_FULL = `${EVENT_ORG} ${EVENT_NAME}`;
