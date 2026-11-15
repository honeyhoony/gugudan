/** 사다리: bridges[row][i] = lane i ↔ i+1 연결 */

export function generateBridges(lanes: number, rows = 10): boolean[][] {
  const bridges: boolean[][] = [];
  for (let r = 0; r < rows; r++) {
    const row = Array.from({ length: Math.max(0, lanes - 1) }, () => false);
    for (let i = 0; i < row.length; i++) {
      if (i > 0 && row[i - 1]) continue;
      row[i] = Math.random() < 0.48;
    }
    bridges.push(row);
  }
  return bridges;
}

export function traceLane(start: number, bridges: boolean[][]): number {
  let pos = start;
  for (const row of bridges) {
    if (pos > 0 && row[pos - 1]) pos -= 1;
    else if (pos < row.length && row[pos]) pos += 1;
  }
  return pos;
}

export function buildMapping(
  lanes: number,
  bridges: boolean[][],
): Record<number, number> {
  const mapping: Record<number, number> = {};
  for (let i = 0; i < lanes; i++) {
    mapping[i] = traceLane(i, bridges);
  }
  return mapping;
}

export function pickResults(count: number, pool: string[]): string[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(shuffled[i % shuffled.length]!);
  }
  return out;
}
