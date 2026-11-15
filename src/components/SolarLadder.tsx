"use client";

import { useMemo } from "react";

export function SolarLadder({
  laneCount,
  bridges,
  topLabels,
  bottomLabels,
  animate = false,
}: {
  laneCount: number;
  bridges: boolean[][];
  topLabels: string[];
  bottomLabels: string[];
  animate?: boolean;
}) {
  const width = 100;
  const height = 100;
  const padX = 8;
  const padY = 12;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const rows = Math.max(bridges.length, 1);

  const xs = useMemo(
    () =>
      Array.from({ length: laneCount }, (_, i) =>
        laneCount === 1
          ? padX + innerW / 2
          : padX + (innerW * i) / (laneCount - 1),
      ),
    [laneCount, innerW, padX],
  );

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-sky-300/25 bg-[#071820] p-3 md:p-4">
      <div className="mb-2 flex items-center justify-between px-1 text-xs text-sky-100/70">
        <span>태양광 패널 사다리</span>
        <span className="tracking-widest">PV MODULE</span>
      </div>
      <div className="relative aspect-[16/11] w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className={`h-full w-full ${animate ? "anim-ladder" : ""}`}
        >
          <defs>
            <linearGradient id="panelGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.55" />
            </linearGradient>
          </defs>
          <rect
            x={padX - 2}
            y={padY - 2}
            width={innerW + 4}
            height={innerH + 4}
            rx={2}
            fill="url(#panelGrad)"
            stroke="#7dd3fc"
            strokeOpacity="0.35"
          />
          {/* cell grid */}
          {Array.from({ length: 4 }, (_, r) =>
            Array.from({ length: 6 }, (_, c) => (
              <rect
                key={`c-${r}-${c}`}
                x={padX + (innerW * c) / 6 + 0.4}
                y={padY + (innerH * r) / 4 + 0.4}
                width={innerW / 6 - 0.8}
                height={innerH / 4 - 0.8}
                fill="#0c4a6e"
                fillOpacity="0.35"
                stroke="#38bdf8"
                strokeOpacity="0.15"
              />
            )),
          )}
          {xs.map((x, i) => (
            <line
              key={`v-${i}`}
              x1={x}
              y1={padY}
              x2={x}
              y2={padY + innerH}
              stroke="#e0f2fe"
              strokeWidth="0.7"
            />
          ))}
          {bridges.map((row, r) => {
            const y = padY + ((r + 1) * innerH) / (rows + 1);
            return row.map((on, i) =>
              on ? (
                <line
                  key={`h-${r}-${i}`}
                  x1={xs[i]}
                  y1={y}
                  x2={xs[i + 1]}
                  y2={y}
                  stroke="#fbbf24"
                  strokeWidth="0.85"
                />
              ) : null,
            );
          })}
        </svg>
      </div>
      <div
        className="mt-2 grid gap-1 text-center text-[10px] text-sky-50 md:text-xs"
        style={{ gridTemplateColumns: `repeat(${laneCount}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: laneCount }, (_, i) => (
          <div key={`t-${i}`} className="truncate rounded bg-black/30 px-1 py-1">
            {topLabels[i] || `${i + 1}`}
          </div>
        ))}
      </div>
      <div
        className="mt-1 grid gap-1 text-center text-[10px] text-[var(--gold)] md:text-xs"
        style={{ gridTemplateColumns: `repeat(${laneCount}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: laneCount }, (_, i) => (
          <div key={`b-${i}`} className="truncate rounded bg-black/40 px-1 py-1">
            {bottomLabels[i] || "?"}
          </div>
        ))}
      </div>
    </div>
  );
}
