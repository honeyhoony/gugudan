import type { Player } from "@/lib/types";

export function ScoreList({
  players,
  highlightId,
  compact = false,
}: {
  players: Player[];
  highlightId?: string | null;
  compact?: boolean;
}) {
  const sorted = [...players].sort(
    (a, b) => b.score - a.score || a.joinedAt - b.joinedAt,
  );

  if (sorted.length === 0) {
    return (
      <p className="text-white/50">아직 선수가 없습니다. QR을 보여주세요.</p>
    );
  }

  return (
    <ul className={compact ? "space-y-1.5" : "space-y-2"}>
      {sorted.map((p, i) => {
        const hot = highlightId === p.id;
        return (
          <li
            key={p.id}
            className={`flex items-center justify-between rounded-xl px-3 py-2 ${
              hot ? "bg-[var(--gold)]/20 text-[var(--gold)]" : "bg-white/5"
            }`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="w-6 shrink-0 text-white/40">{i + 1}</span>
              <span className="truncate font-medium">{p.name}</span>
            </span>
            <span className="font-bold tabular-nums">{p.score}</span>
          </li>
        );
      })}
    </ul>
  );
}
