"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { JoinQr } from "@/components/JoinQr";
import { PowerMeter } from "@/components/PowerMeter";
import { ScoreList } from "@/components/ScoreList";
import { SolarLadder } from "@/components/SolarLadder";
import { TreasureMap } from "@/components/TreasureMap";
import { TREASURE_SPOTS } from "@/lib/content";
import { hostCommand, hostStorageKey } from "@/lib/client";
import { useRoom } from "@/hooks/useRoom";
import { badgeLabel, formatKwh, rankByTarget, readingAt } from "@/lib/kwh";
import type { GameMode, RoomState } from "@/lib/types";

export default function HostPage() {
  const params = useParams<{ code: string }>();
  const code = String(params.code || "").toUpperCase();
  const [hostKey, setHostKey] = useState<string | null>(null);
  const [customQ, setCustomQ] = useState("");
  const [customA, setCustomA] = useState<"O" | "X">("O");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { state, setState, error, ready } = useRoom(code, { intervalMs: 700 });

  useEffect(() => {
    setHostKey(localStorage.getItem(hostStorageKey(code)));
  }, [code]);

  function run(action: string, payload: Record<string, unknown> = {}) {
    if (!hostKey) {
      setMsg("이 브라우저에 진행자 키가 없습니다. 방을 다시 만들어 주세요.");
      return;
    }
    setMsg(null);
    startTransition(() => {
      void (async () => {
        try {
          const next = await hostCommand(code, hostKey, action, payload);
          setState(next);
        } catch (err) {
          setMsg(err instanceof Error ? err.message : "실패");
        }
      })();
    });
  }

  const oxCounts = useMemo(() => {
    if (!state) return { o: 0, x: 0, total: 0 };
    const values = Object.values(state.ox.answers);
    return {
      o: values.filter((v) => v === "O").length,
      x: values.filter((v) => v === "X").length,
      total: values.length,
    };
  }, [state]);

  const ladderTop = useMemo(() => {
    if (!state) return [];
    return Array.from({ length: state.ladder.laneCount }, (_, i) => {
      const entry = Object.entries(state.ladder.picks).find(([, lane]) => lane === i);
      if (!entry) return `${i + 1}번`;
      return state.players.find((p) => p.id === entry[0])?.name ?? `${i + 1}번`;
    });
  }, [state]);

  if (!ready) return <Centered>화면을 준비하는 중…</Centered>;
  if (error || !state) return <Centered>{error || "방을 찾을 수 없습니다."}</Centered>;
  if (!hostKey) {
    return (
      <Centered>
        진행자 권한이 없는 화면입니다.
        <br />
        홈에서 대회장을 다시 열어 주세요.
      </Centered>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[1400px] flex-col gap-5 px-4 py-4 md:px-8 md:py-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="brand-display text-2xl text-[var(--gold)]">한판</p>
          <h1 className="mt-1 text-2xl font-bold md:text-4xl">{state.title}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-white/50">입장 코드</p>
            <p className="brand-display text-4xl tracking-[0.2em] text-white">
              {code}
            </p>
          </div>
          <div className="hidden sm:block">
            <JoinQr code={code} />
          </div>
        </div>
      </header>

      <div className="grid flex-1 gap-5 lg:grid-cols-[1fr_300px]">
        <section className="panel flex min-h-[420px] flex-col rounded-3xl p-5 md:p-8">
          <ModeTabs
            mode={state.mode}
            onChange={(mode) => run("setMode", { mode })}
            disabled={pending}
          />
          <div className="mt-6 flex flex-1 flex-col">
            {state.mode === "lobby" ? (
              <LobbyView count={state.players.length} code={code} />
            ) : null}
            {state.mode === "ox" ? (
              <OxHostView
                state={state}
                counts={oxCounts}
                customQ={customQ}
                customA={customA}
                setCustomQ={setCustomQ}
                setCustomA={setCustomA}
                pending={pending}
                onStart={() =>
                  run("oxStart", { question: customQ, answer: customA })
                }
                onRandom={() => run("oxStart", {})}
                onReveal={() => run("oxReveal")}
                onReset={() => run("oxReset")}
              />
            ) : null}
            {state.mode === "treasure" ? (
              <TreasureHostView
                state={state}
                pending={pending}
                onStart={() => run("treasureStart", {})}
                onReveal={() => run("treasureReveal")}
                onReset={() => run("treasureReset")}
              />
            ) : null}
            {state.mode === "ladder" ? (
              <LadderHostView
                state={state}
                topLabels={ladderTop}
                pending={pending}
                onOpen={() => run("ladderOpen", {})}
                onRun={() => run("ladderRun")}
                onReset={() => run("ladderReset")}
              />
            ) : null}
            {state.mode === "mash" ? (
              <MashHostView
                state={state}
                pending={pending}
                onStart={() => run("mashStart")}
                onReset={() => run("mashReset")}
              />
            ) : null}
            {state.mode === "mole" ? (
              <MoleHostView
                state={state}
                pending={pending}
                onStart={() => run("moleStart")}
                onReset={() => run("moleReset")}
              />
            ) : null}
            {state.mode === "kwh" ? (
              <KwhHostView
                state={state}
                pending={pending}
                onStart={() => run("kwhStart")}
                onReveal={() => run("kwhReveal")}
                onReset={() => run("kwhReset")}
              />
            ) : null}
          </div>
        </section>

        <aside className="panel rounded-3xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">선수 {state.players.length}</h2>
            <button
              type="button"
              className="text-xs text-white/50 underline"
              onClick={() => run("resetScores")}
            >
              점수 초기화
            </button>
          </div>
          <div className="sm:hidden">
            <JoinQr code={code} />
            <div className="my-4 h-px bg-white/10" />
          </div>
          <ScoreList players={state.players} />
        </aside>
      </div>

      {msg ? (
        <p className="rounded-xl bg-red-500/20 px-4 py-3 text-sm">{msg}</p>
      ) : null}
    </main>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6 text-center text-lg text-white/80">
      <p>{children}</p>
    </main>
  );
}

function ModeTabs({
  mode,
  onChange,
  disabled,
}: {
  mode: GameMode;
  onChange: (m: GameMode) => void;
  disabled?: boolean;
}) {
  const items: { id: GameMode; label: string }[] = [
    { id: "lobby", label: "대기실" },
    { id: "ladder", label: "1 사다리" },
    { id: "mash", label: "2 연타" },
    { id: "kwh", label: "3 5.00kWh" },
    { id: "mole", label: "4 두더지" },
    { id: "ox", label: "O/X" },
    { id: "treasure", label: "오봉산" },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          disabled={disabled}
          onClick={() => onChange(item.id)}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            mode === item.id
              ? "bg-[var(--gold)] text-[#1a1208]"
              : "bg-white/10 text-white/80 hover:bg-white/15"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function LobbyView({ count, code }: { count: number; code: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <p className="text-white/60">선수 입장 중 · 개회 대기</p>
      <p className="brand-display mt-3 text-7xl text-white md:text-8xl">{count}</p>
      <p className="mt-2 text-xl text-white/70">명 등록</p>
      <p className="mt-8 max-w-md text-white/55">
        휴대폰에서 <span className="text-[var(--gold)]">{code}</span> 입력 후
        1 전력망 사다리 → 2 연타 → 3 목표 5.00 kWh → 4 대기전력 두더지
      </p>
    </div>
  );
}

function liveRanking(
  players: RoomState["players"],
  counts: Record<string, number>,
) {
  return [...players]
    .map((p) => ({ ...p, taps: counts[p.id] ?? 0 }))
    .sort((a, b) => b.taps - a.taps || a.joinedAt - b.joinedAt);
}

function MashHostView({
  state,
  pending,
  onStart,
  onReset,
}: {
  state: RoomState;
  pending: boolean;
  onStart: () => void;
  onReset: () => void;
}) {
  const m = state.mash;
  const ranked = liveRanking(state.players, m.counts);
  const remain =
    m.endsAt != null ? Math.max(0, Math.ceil((m.endsAt - Date.now()) / 1000)) : 0;

  return (
    <div className="flex flex-1 flex-col">
      <h2 className="brand-display text-4xl md:text-5xl">에너지 다이어트 연타</h2>
      <p className="mt-2 text-white/60">
        2라운드 광클 아케이드. 5초 동안 미친 듯이 터치!
      </p>
      <div className="mt-8 flex flex-1 flex-col items-center justify-center text-center">
        {m.phase === "idle" ? (
          <p className="brand-display text-5xl text-white/40">READY?</p>
        ) : null}
        {m.phase === "countdown" ? (
          <p className="brand-display anim-go text-8xl text-[var(--gold)]">
            {remain || "GO"}
          </p>
        ) : null}
        {m.phase === "play" ? (
          <>
            <p className="brand-display anim-go text-7xl text-[var(--coral)]">연타!</p>
            <p className="mt-2 text-2xl text-white/70">{remain}초</p>
          </>
        ) : null}
        {m.phase === "result" ? (
          <div className="anim-rise">
            <p className="text-white/60">연타왕</p>
            <p className="brand-display mt-2 text-5xl text-[var(--gold)]">
              {ranked[0]?.taps ? ranked[0].name : "?"}
            </p>
            <p className="mt-2 text-xl">{ranked[0]?.taps ?? 0} 회</p>
          </div>
        ) : null}
      </div>
      {(m.phase === "play" || m.phase === "result") && (
        <ol className="mt-4 grid gap-2 md:grid-cols-2">
          {ranked.slice(0, 6).map((p, i) => (
            <li key={p.id} className="rounded-xl bg-white/5 px-3 py-2 text-sm">
              {i + 1}. {p.name}
              <span className="float-right font-bold text-[var(--gold)]">
                {p.taps}
              </span>
            </li>
          ))}
        </ol>
      )}
      <div className="mt-5 flex gap-3">
        {(m.phase === "idle" || m.phase === "result") && (
          <button type="button" disabled={pending} onClick={onStart} className="btn btn-primary">
            {m.phase === "result" ? "한 판 더!!" : "시작"}
          </button>
        )}
        {m.phase !== "idle" ? (
          <button type="button" disabled={pending} onClick={onReset} className="btn btn-ghost">
            리셋
          </button>
        ) : null}
      </div>
    </div>
  );
}

function MoleHostView({
  state,
  pending,
  onStart,
  onReset,
}: {
  state: RoomState;
  pending: boolean;
  onStart: () => void;
  onReset: () => void;
}) {
  const m = state.mole;
  const ranked = liveRanking(state.players, m.hits);
  const remain =
    m.endsAt != null ? Math.max(0, Math.ceil((m.endsAt - Date.now()) / 1000)) : 0;

  return (
    <div className="flex flex-1 flex-col">
      <h2 className="brand-display text-4xl md:text-5xl">대기전력 뱀파이어</h2>
      <p className="mt-2 text-white/60">
        4라운드 복불복. 빨간 ON(대기전력)을 휴대폰으로 팡팡!
      </p>
      <div className="mt-6 grid grid-cols-3 gap-3 md:gap-4">
        {Array.from({ length: m.slots }, (_, i) => {
          const on = m.phase === "play" && m.activeSlot === i;
          return (
            <div
              key={i}
              className={`flex aspect-square items-center justify-center rounded-2xl border-2 text-2xl font-bold md:text-4xl ${
                on
                  ? "anim-go border-[var(--coral)] bg-[var(--coral)] text-white"
                  : "border-white/10 bg-black/30 text-white/25"
              }`}
            >
              {on ? "ON" : "off"}
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-white/55">
        {m.phase === "play" ? `남은 시간 ${remain}초` : m.phase === "result" ? "종료!" : "대기"}
      </p>
      {m.phase === "result" ? (
        <p className="brand-display mt-2 text-3xl text-[var(--gold)]">
          절전왕 {ranked[0]?.taps ? ranked[0].name : "?"}
        </p>
      ) : null}
      {(m.phase === "play" || m.phase === "result") && (
        <ol className="mt-3 grid gap-2 md:grid-cols-2">
          {ranked.slice(0, 6).map((p, i) => (
            <li key={p.id} className="rounded-xl bg-white/5 px-3 py-2 text-sm">
              {i + 1}. {p.name}
              <span className="float-right font-bold text-[var(--gold)]">
                {p.taps}
              </span>
            </li>
          ))}
        </ol>
      )}
      <div className="mt-5 flex gap-3">
        {(m.phase === "idle" || m.phase === "result") && (
          <button type="button" disabled={pending} onClick={onStart} className="btn btn-primary">
            {m.phase === "result" ? "한 판 더!!" : "시작"}
          </button>
        )}
        {m.phase !== "idle" ? (
          <button type="button" disabled={pending} onClick={onReset} className="btn btn-ghost">
            리셋
          </button>
        ) : null}
      </div>
    </div>
  );
}

function OxHostView({
  state,
  counts,
  customQ,
  customA,
  setCustomQ,
  setCustomA,
  pending,
  onStart,
  onRandom,
  onReveal,
  onReset,
}: {
  state: RoomState;
  counts: { o: number; x: number; total: number };
  customQ: string;
  customA: "O" | "X";
  setCustomQ: (v: string) => void;
  setCustomA: (v: "O" | "X") => void;
  pending: boolean;
  onStart: () => void;
  onRandom: () => void;
  onReveal: () => void;
  onReset: () => void;
}) {
  const { ox } = state;
  if (ox.phase === "idle") {
    return (
      <div className="flex flex-1 flex-col justify-center gap-6">
        <div>
          <h2 className="brand-display text-4xl md:text-5xl">O / X 경기</h2>
          <p className="mt-2 text-white/60">
            가볍고 신박한 에너지·일상 문제. 단체로 빠르게!
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            value={customQ}
            onChange={(e) => setCustomQ(e.target.value)}
            placeholder="직접 문제 (비우면 랜덤 출제)"
            className="rounded-xl border border-white/15 bg-black/25 px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--gold)]"
            maxLength={80}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCustomA("O")}
              className={`btn flex-1 ${customA === "O" ? "btn-ox-o" : "btn-ghost"}`}
            >
              정답 O
            </button>
            <button
              type="button"
              onClick={() => setCustomA("X")}
              className={`btn flex-1 ${customA === "X" ? "btn-ox-x" : "btn-ghost"}`}
            >
              정답 X
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={pending} onClick={onStart} className="btn btn-primary">
            이 문제로 시작
          </button>
          <button type="button" disabled={pending} onClick={onRandom} className="btn btn-ghost">
            랜덤 문제
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <p className="text-sm uppercase tracking-[0.2em] text-white/45">Question</p>
      <h2 className="brand-display mt-3 text-3xl leading-snug md:text-5xl">
        {ox.question}
      </h2>
      <div className="mt-10 grid flex-1 grid-cols-2 gap-4">
        <div className="rounded-3xl bg-teal-500/20 p-6 text-center">
          <p className="brand-display text-6xl text-teal-200">O</p>
          <p className="mt-3 text-4xl font-bold tabular-nums">{counts.o}</p>
        </div>
        <div className="rounded-3xl bg-[var(--coral)]/20 p-6 text-center">
          <p className="brand-display text-6xl text-orange-200">X</p>
          <p className="mt-3 text-4xl font-bold tabular-nums">{counts.x}</p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <p className="text-white/55">
          응답 {counts.total}/{state.players.length}
        </p>
        {ox.phase === "question" ? (
          <button type="button" disabled={pending} onClick={onReveal} className="btn btn-primary">
            정답 공개
          </button>
        ) : (
          <>
            <p className="brand-display text-3xl text-[var(--gold)]">정답 {ox.answer}</p>
            <button type="button" disabled={pending} onClick={onReset} className="btn btn-ghost">
              다음 문제
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function TreasureHostView({
  state,
  pending,
  onStart,
  onReveal,
  onReset,
}: {
  state: RoomState;
  pending: boolean;
  onStart: () => void;
  onReveal: () => void;
  onReset: () => void;
}) {
  const t = state.treasure;
  const spotLabel =
    TREASURE_SPOTS.find((s) => s.id === t.spotId)?.label ?? t.spotId;

  if (t.phase === "idle") {
    return (
      <div className="flex flex-1 flex-col justify-center gap-6">
        <div>
          <h2 className="brand-display text-4xl md:text-5xl">오봉산 보물찾기</h2>
          <p className="mt-2 text-white/60">
            힌트를 듣고 휴대폰에서 보물 위치를 고르세요.
          </p>
        </div>
        <TreasureMap />
        <button type="button" disabled={pending} onClick={onStart} className="btn btn-primary w-fit">
          힌트 공개 · 시작
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <p className="text-sm text-white/50">보물 힌트</p>
      <h2 className="brand-display text-2xl leading-snug md:text-4xl">{t.clue}</h2>
      <TreasureMap
        guesses={t.guesses}
        highlightId={t.phase === "reveal" ? t.spotId : undefined}
        reveal={t.phase === "reveal"}
      />
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-white/55">
          선택 {Object.keys(t.guesses).length}/{state.players.length}
        </p>
        {t.phase === "clue" ? (
          <button type="button" disabled={pending} onClick={onReveal} className="btn btn-primary">
            보물 공개
          </button>
        ) : (
          <>
            <p className="brand-display text-2xl text-[var(--gold)]">
              보물 위치: {spotLabel}
            </p>
            <button type="button" disabled={pending} onClick={onReset} className="btn btn-ghost">
              다음 힌트
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function LadderHostView({
  state,
  topLabels,
  pending,
  onOpen,
  onRun,
  onReset,
}: {
  state: RoomState;
  topLabels: string[];
  pending: boolean;
  onOpen: () => void;
  onRun: () => void;
  onReset: () => void;
}) {
  const L = state.ladder;

  if (L.phase === "idle") {
    return (
      <div className="flex flex-1 flex-col justify-center gap-5">
        <div>
          <h2 className="brand-display text-4xl md:text-5xl">전력망 사다리</h2>
          <p className="mt-2 text-white/60">
            1라운드 운빨. 태양광 패널 사다리로 미션·자리 뽑기!
          </p>
        </div>
        <SolarLadder
          laneCount={6}
          bridges={[]}
          topLabels={Array.from({ length: 6 }, (_, i) => `${i + 1}`)}
          bottomLabels={Array.from({ length: 6 }, () => "?")}
        />
        <button
          type="button"
          disabled={pending || state.players.length < 2}
          onClick={onOpen}
          className="btn btn-primary w-fit"
        >
          레인 선택 열기
        </button>
      </div>
    );
  }

  const showBottom =
    L.phase === "result" || L.phase === "running"
      ? L.results
      : Array.from({ length: L.laneCount }, () => "?");

  return (
    <div className="flex flex-1 flex-col gap-4">
      <SolarLadder
        laneCount={L.laneCount}
        bridges={L.bridges}
        topLabels={topLabels}
        bottomLabels={showBottom}
        animate={L.phase === "running"}
      />
      <div className="flex flex-wrap gap-3">
        {L.phase === "picking" ? (
          <>
            <p className="self-center text-white/55">
              선택 {Object.keys(L.picks).length}/{L.laneCount} 레인
            </p>
            <button type="button" disabled={pending} onClick={onRun} className="btn btn-primary">
              사다리 타기!
            </button>
          </>
        ) : null}
        {L.phase === "running" ? (
          <p className="brand-display text-2xl text-[var(--gold)]">전류 흐르는 중…</p>
        ) : null}
        {(L.phase === "result" || L.phase === "picking" || L.phase === "running") && (
          <button type="button" disabled={pending} onClick={onReset} className="btn btn-ghost">
            리셋
          </button>
        )}
      </div>
      {L.phase === "result" ? (
        <ul className="grid gap-2 md:grid-cols-2">
          {Object.entries(L.picks).map(([pid, lane]) => {
            const name = state.players.find((p) => p.id === pid)?.name ?? "?";
            const end = L.mapping[lane] ?? lane;
            return (
              <li
                key={pid}
                className="rounded-xl bg-white/5 px-3 py-2 text-sm"
              >
                <span className="font-semibold">{name}</span>
                <span className="text-white/40"> → </span>
                <span className="text-[var(--gold)]">{L.results[end]}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function KwhHostView({
  state,
  pending,
  onStart,
  onReveal,
  onReset,
}: {
  state: RoomState;
  pending: boolean;
  onStart: () => void;
  onReveal: () => void;
  onReset: () => void;
}) {
  const k = state.kwh;
  const stopped = Object.keys(k.stops).length;
  const live =
    k.phase === "play" && k.startedAt ? readingAt(k.startedAt) : 0;
  const remain =
    k.endsAt != null ? Math.max(0, Math.ceil((k.endsAt - Date.now()) / 1000)) : 0;
  const ranked = rankByTarget(k.stops, k.target);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <p className="text-sm font-medium text-[var(--gold)]">3라운드 · 메인 종목</p>
        <h2 className="brand-display mt-1 text-3xl md:text-5xl">
          목표 전력 {k.target.toFixed(2)} kWh 사수
        </h2>
        <p className="mt-2 max-w-2xl text-white/65">
          이번 달 목표 전력량은 정확히 {k.target.toFixed(2)} kWh!
          과부하도, 절전 미달도 안 됩니다. 감각으로 STOP.
        </p>
      </div>

      {k.phase === "idle" ? (
        <div className="flex flex-1 flex-col justify-center gap-5">
          <PowerMeter value={0} target={k.target} large />
          <button type="button" disabled={pending} onClick={onStart} className="btn btn-primary w-fit">
            계측 시작
          </button>
        </div>
      ) : null}

      {k.phase === "countdown" ? (
        <div className="flex flex-1 flex-col items-center justify-center">
          <p className="text-white/50">계측 준비</p>
          <p className="brand-display anim-go mt-3 text-8xl text-[var(--gold)]">
            {remain || "GO"}
          </p>
        </div>
      ) : null}

      {k.phase === "play" ? (
        <>
          <PowerMeter value={live} hidden target={k.target} large label="현장 계측 중 (선수 화면 가림)" />
          <p className="text-white/55">
            STOP {stopped}/{state.players.length} · 자동마감 {remain}초
          </p>
          <ul className="flex flex-wrap gap-2 text-sm">
            {state.players.map((p) => (
              <li
                key={p.id}
                className={`rounded-full px-3 py-1 ${
                  k.stops[p.id] != null ? "bg-teal-500/30 text-teal-100" : "bg-white/10 text-white/50"
                }`}
              >
                {p.name} {k.stops[p.id] != null ? "차단" : "계측중"}
              </li>
            ))}
          </ul>
          <button type="button" disabled={pending || stopped < 1} onClick={onReveal} className="btn btn-primary w-fit">
            결과 공개
          </button>
        </>
      ) : null}

      {k.phase === "reveal" ? (
        <>
          <p className="brand-display text-2xl text-[var(--gold)]">
            1등 {state.players.find((p) => p.id === ranked[0]?.playerId)?.name ?? "?"}
            {ranked[0] ? ` · ${formatKwh(ranked[0].value)} kWh` : ""}
          </p>
          <ol className="grid gap-2 md:grid-cols-2">
            {ranked.map((row, i) => {
              const name = state.players.find((p) => p.id === row.playerId)?.name ?? "?";
              return (
                <li key={row.playerId} className="rounded-xl bg-white/5 px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">
                      {i + 1}. {name}
                    </span>
                    <span className="font-mono text-[var(--gold)]">
                      {formatKwh(row.value)} kWh
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-white/55">
                    오차 {formatKwh(row.delta)} · {badgeLabel(row.badge)}
                  </p>
                </li>
              );
            })}
          </ol>
          <button type="button" disabled={pending} onClick={onReset} className="btn btn-ghost w-fit">
            다시 계측
          </button>
        </>
      ) : null}

      {k.phase !== "idle" && k.phase !== "reveal" ? (
        <button type="button" disabled={pending} onClick={onReset} className="btn btn-ghost w-fit">
          리셋
        </button>
      ) : null}
    </div>
  );
}
