import type { MicroId } from "@/lib/types";

export const MICRO_DURATION_MS: Record<MicroId, number> = {
  rub: 15000,
  sprint: 40000,
  ruler: 0, // reaction — ends on tap after go
  mathOdd: 30000,
  leftRight: 30000,
  rps: 30000,
  order: 60000,
};

export const MICRO_COUNTDOWN_MS = 3000;

export function newMathOdd(): {
  expr: string;
  odd: boolean;
} {
  const a = 2 + Math.floor(Math.random() * 12);
  const b = 2 + Math.floor(Math.random() * 12);
  const op = Math.random() < 0.5 ? "+" : "×";
  const val = op === "+" ? a + b : a * b;
  return { expr: `${a} ${op} ${b}`, odd: val % 2 === 1 };
}

export function newLeftRight(): {
  prompt: string;
  correct: "L" | "R";
} {
  const pool: { prompt: string; correct: "L" | "R" }[] = [
    { prompt: "왼쪽!", correct: "L" },
    { prompt: "오른쪽!", correct: "R" },
    { prompt: "← 이쪽", correct: "L" },
    { prompt: "이쪽 →", correct: "R" },
    { prompt: "LEFT", correct: "L" },
    { prompt: "RIGHT", correct: "R" },
    { prompt: "오른손 들어!", correct: "R" },
    { prompt: "왼손 들어!", correct: "L" },
  ];
  return pool[Math.floor(Math.random() * pool.length)]!;
}

export function newRps(): {
  cpu: "가위" | "바위" | "보";
  goal: "이기기" | "지기";
} {
  const hands = ["가위", "바위", "보"] as const;
  const goals = ["이기기", "지기"] as const;
  return {
    cpu: hands[Math.floor(Math.random() * 3)]!,
    goal: goals[Math.floor(Math.random() * 2)]!,
  };
}

export function rpsWins(
  me: "가위" | "바위" | "보",
  cpu: "가위" | "바위" | "보",
): boolean {
  if (me === cpu) return false;
  return (
    (me === "가위" && cpu === "보") ||
    (me === "바위" && cpu === "가위") ||
    (me === "보" && cpu === "바위")
  );
}

export function initialChallenge(id: MicroId): Record<string, unknown> {
  switch (id) {
    case "mathOdd":
      return newMathOdd();
    case "leftRight":
      return newLeftRight();
    case "rps":
      return newRps();
    case "ruler":
      return { goAt: null as number | null };
    default:
      return {};
  }
}

export function microTitle(id: MicroId): string {
  const map: Record<MicroId, string> = {
    rub: "문질문질",
    sprint: "100m 달리기",
    ruler: "자를 잡아라",
    mathOdd: "산수 홀짝",
    leftRight: "좌우로",
    rps: "가위바위보",
    order: "순서대로",
  };
  return map[id];
}
