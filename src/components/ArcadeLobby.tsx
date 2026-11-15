"use client";

import { ARCADE_GAMES, type ArcadeGame } from "@/lib/arcadeCatalog";
import { JoinQr } from "@/components/JoinQr";
import { ScoreList } from "@/components/ScoreList";
import type { Player } from "@/lib/types";

export function ArcadeLobby({
  code,
  title,
  players,
  onPick,
  disabled,
}: {
  code: string;
  title: string;
  players: Player[];
  onPick: (game: ArcadeGame) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid flex-1 gap-5 lg:grid-cols-[1fr_280px]">
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm text-[var(--gold)]">팀대항 오락실</p>
            <h2 className="brand-display text-3xl md:text-4xl">게임 고르기</h2>
            <p className="mt-1 text-sm text-white/55">{title}</p>
          </div>
          <p className="text-sm text-white/45">
            [고르기만 하면 됨] 미니게임 {ARCADE_GAMES.length}종
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {ARCADE_GAMES.map((game) => (
            <button
              key={game.no}
              type="button"
              disabled={disabled}
              onClick={() => onPick(game)}
              className="group rounded-2xl border border-white/10 bg-black/35 p-3 text-left transition hover:-translate-y-0.5 hover:border-white/25 active:scale-[0.98]"
              style={{ boxShadow: `inset 0 0 0 1px ${game.accent}33` }}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-black"
                  style={{ background: game.accent }}
                >
                  {game.no}
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70">
                  {game.tag}
                </span>
              </div>
              <p className="mt-3 text-base font-bold leading-tight md:text-lg">
                {game.title}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-white/50">{game.blurb}</p>
              <p className="mt-2 text-[11px] font-semibold" style={{ color: game.accent }}>
                {game.seconds}
              </p>
            </button>
          ))}
        </div>
      </section>

      <aside className="panel flex flex-col rounded-3xl p-4">
        <h3 className="font-bold">종합 순위</h3>
        <p className="mb-3 text-xs text-white/45">선수 {players.length}명</p>
        <div className="min-h-0 flex-1 overflow-auto">
          <ScoreList players={players} />
        </div>
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="mb-2 text-center text-xs text-white/50">입장 코드 {code}</p>
          <JoinQr code={code} />
        </div>
      </aside>
    </div>
  );
}
