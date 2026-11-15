import type { GameMode } from "@/lib/types";
import type { MicroId } from "@/lib/types";

export type ArcadeGame = {
  no: number;
  title: string;
  blurb: string;
  tag: "빠르게" | "생각해" | "메인" | "운빨";
  seconds: string;
  accent: string;
  /** existing mode OR micro */
  kind: "mode" | "micro";
  mode?: GameMode;
  microId?: MicroId;
};

/** 팀대항 오락실 스타일 카탈로그 + 에너지효율부 메인 종목 */
export const ARCADE_GAMES: ArcadeGame[] = [
  {
    no: 1,
    title: "타타왕",
    blurb: "제한시간 동안 미친 듯이 터치!",
    tag: "빠르게",
    seconds: "5초",
    accent: "#f97316",
    kind: "mode",
    mode: "mash",
  },
  {
    no: 2,
    title: "문질문질",
    blurb: "화면을 좌우로 문질러 발전량 UP",
    tag: "빠르게",
    seconds: "15초",
    accent: "#fb923c",
    kind: "micro",
    microId: "rub",
  },
  {
    no: 3,
    title: "대기전력 두더지",
    blurb: "빨간 ON(대기전력)을 팡팡!",
    tag: "빠르게",
    seconds: "12초",
    accent: "#ef4444",
    kind: "mode",
    mode: "mole",
  },
  {
    no: 4,
    title: "100m 달리기",
    blurb: "좌우 번갈아 터치로 골인",
    tag: "빠르게",
    seconds: "40초",
    accent: "#f59e0b",
    kind: "micro",
    microId: "sprint",
  },
  {
    no: 5,
    title: "자를 잡아라",
    blurb: "떨어질 때 재빨리 STOP",
    tag: "빠르게",
    seconds: "반응",
    accent: "#eab308",
    kind: "micro",
    microId: "ruler",
  },
  {
    no: 6,
    title: "산수 홀짝",
    blurb: "계산 결과가 홀수? 짝수?",
    tag: "생각해",
    seconds: "30초",
    accent: "#22c55e",
    kind: "micro",
    microId: "mathOdd",
  },
  {
    no: 7,
    title: "좌우로",
    blurb: "지시대로 왼쪽/오른쪽!",
    tag: "생각해",
    seconds: "30초",
    accent: "#14b8a6",
    kind: "micro",
    microId: "leftRight",
  },
  {
    no: 8,
    title: "가위바위보",
    blurb: "이기기 / 지시기 미션",
    tag: "생각해",
    seconds: "30초",
    accent: "#06b6d4",
    kind: "micro",
    microId: "rps",
  },
  {
    no: 9,
    title: "순서대로",
    blurb: "1부터 16까지 빠르게",
    tag: "생각해",
    seconds: "60초",
    accent: "#3b82f6",
    kind: "micro",
    microId: "order",
  },
  {
    no: 10,
    title: "목표 5.00 kWh",
    blurb: "감각으로 전력량 사수! MAIN",
    tag: "메인",
    seconds: "감각",
    accent: "#e8b86d",
    kind: "mode",
    mode: "kwh",
  },
  {
    no: 11,
    title: "전력망 사다리",
    blurb: "태양광 패널 사다리 복불복",
    tag: "운빨",
    seconds: "뽑기",
    accent: "#38bdf8",
    kind: "mode",
    mode: "ladder",
  },
  {
    no: 12,
    title: "오봉산 보물",
    blurb: "힌트 듣고 보물 위치 찾기",
    tag: "생각해",
    seconds: "라운드",
    accent: "#34d399",
    kind: "mode",
    mode: "treasure",
  },
  {
    no: 13,
    title: "O/X 경기",
    blurb: "가벼운 에너지·일상 문제",
    tag: "생각해",
    seconds: "라운드",
    accent: "#a3e635",
    kind: "mode",
    mode: "ox",
  },
];

export function findArcadeGame(
  kind: "mode" | "micro",
  id: string,
): ArcadeGame | undefined {
  return ARCADE_GAMES.find((g) =>
    kind === "mode" ? g.mode === id : g.microId === id,
  );
}
