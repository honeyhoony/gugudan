export const KWH_TARGET = 5.0;
export const KWH_COUNTDOWN_MS = 3000;
/** 자동 종료 — 12초 = 12.00 kWh */
export const KWH_MAX_MS = 12000;

export function msToKwh(ms: number): number {
  const raw = Math.max(0, ms) / 1000;
  return Math.round(raw * 100) / 100;
}

export function readingAt(startedAt: number, at: number = Date.now()): number {
  return msToKwh(at - startedAt);
}

export type KwhBadge =
  | "perfect"
  | "close"
  | "waste"
  | "shortage"
  | "ok";

export function kwhBadge(value: number, target = KWH_TARGET): KwhBadge {
  const d = Math.abs(value - target);
  if (d <= 0.01) return "perfect";
  if (value >= 7.5) return "waste";
  if (value <= 2.5) return "shortage";
  if (d <= 0.12) return "close";
  return "ok";
}

export function badgeLabel(badge: KwhBadge): string {
  switch (badge) {
    case "perfect":
      return "정밀 제어왕";
    case "close":
      return "거의 목표 전력";
    case "waste":
      return "전력 낭비 주의보";
    case "shortage":
      return "조기 차단 주의보";
    default:
      return "계측 완료";
  }
}

export function formatKwh(value: number): string {
  return value.toFixed(2);
}

export function rankByTarget(
  stops: Record<string, number>,
  target = KWH_TARGET,
): { playerId: string; value: number; delta: number; badge: KwhBadge }[] {
  return Object.entries(stops)
    .map(([playerId, value]) => ({
      playerId,
      value,
      delta: Math.abs(value - target),
      badge: kwhBadge(value, target),
    }))
    .sort((a, b) => a.delta - b.delta || a.value - b.value);
}
