"use client";

import { TREASURE_SPOTS } from "@/lib/content";

export function TreasureMap({
  highlightId,
  guesses = {},
  reveal = false,
  compact = false,
}: {
  highlightId?: string;
  guesses?: Record<string, string>;
  reveal?: boolean;
  compact?: boolean;
}) {
  const guessCounts: Record<string, number> = {};
  for (const spot of Object.values(guesses)) {
    guessCounts[spot] = (guessCounts[spot] ?? 0) + 1;
  }

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-emerald-400/20 ${
        compact ? "h-56" : "h-72 md:h-[420px]"
      }`}
      style={{
        background:
          "linear-gradient(180deg, #7eb6d9 0%, #a8d4a2 38%, #3d6b45 70%, #2a4a32 100%)",
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 opacity-80">
        <svg viewBox="0 0 100 60" className="h-full w-full" preserveAspectRatio="none">
          <path
            d="M0 60 L0 40 Q12 28 22 34 Q35 20 48 26 Q60 12 72 22 Q85 16 100 28 L100 60 Z"
            fill="#1f4d36"
          />
          <path
            d="M0 60 L0 48 Q20 36 40 44 Q55 30 70 40 Q88 32 100 42 L100 60 Z"
            fill="#163828"
          />
        </svg>
      </div>
      <p className="absolute left-4 top-3 text-sm font-semibold text-white/80 drop-shadow">
        오봉산
      </p>
      {TREASURE_SPOTS.map((spot) => {
        const hot = highlightId === spot.id;
        const count = guessCounts[spot.id] ?? 0;
        return (
          <div
            key={spot.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
          >
            <div
              className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold shadow-lg md:h-12 md:w-12 ${
                reveal && hot
                  ? "anim-go border-[var(--gold)] bg-[var(--gold)] text-[#1a1208]"
                  : "border-white/70 bg-black/45 text-white"
              }`}
            >
              {reveal && hot ? "★" : count > 0 ? count : "·"}
            </div>
            <p
              className={`mt-1 text-xs font-semibold drop-shadow md:text-sm ${
                reveal && hot ? "text-[var(--gold)]" : "text-white"
              }`}
            >
              {spot.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
