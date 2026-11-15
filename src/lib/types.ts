export type GameMode = "lobby" | "ox" | "treasure" | "ladder";

export type Player = {
  id: string;
  name: string;
  score: number;
  joinedAt: number;
  lastSeen: number;
};

export type OxPhase = "idle" | "question" | "reveal";
export type TreasurePhase = "idle" | "clue" | "reveal";
export type LadderPhase = "idle" | "picking" | "running" | "result";

export type OxState = {
  phase: OxPhase;
  question: string;
  answer: "O" | "X";
  answers: Record<string, "O" | "X">;
};

export type TreasureState = {
  phase: TreasurePhase;
  clue: string;
  spotId: string;
  guesses: Record<string, string>;
};

export type LadderState = {
  phase: LadderPhase;
  laneCount: number;
  picks: Record<string, number>;
  bridges: boolean[][];
  results: string[];
  mapping: Record<number, number>;
  runEndsAt: number | null;
};

export type RoomState = {
  title: string;
  mode: GameMode;
  players: Player[];
  ox: OxState;
  treasure: TreasureState;
  ladder: LadderState;
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
