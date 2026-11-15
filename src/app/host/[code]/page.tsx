"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { JoinQr } from "@/components/JoinQr";
import { ScoreList } from "@/components/ScoreList";
import { hostCommand, hostStorageKey } from "@/lib/client";
import { useRoom } from "@/hooks/useRoom";
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
    startTransition(async () => {
      try {
        const next = await hostCommand(code, hostKey, action, payload);
        setState(next);
      } catch (err) {
        setMsg(err instanceof Error ? err.message : "실패");
      }
    });
  }

  const winner = useMemo(() => {
    if (!state?.random.winnerId) return null;
    return state.players.find((p) => p.id === state.random.winnerId) ?? null;
  }, [state]);

  const reactionWinner = useMemo(() => {
    if (!state?.reaction.winnerId) return null;
    return state.players.find((p) => p.id === state.reaction.winnerId) ?? null;
  }, [state]);

  const oxCounts = useMemo(() => {
    if (!state) return { o: 0, x: 0, total: 0 };
    const values = Object.values(state.ox.answers);
    return {
      o: values.filter((v) => v === "O").length,
      x: values.filter((v) => v === "X").length,
      total: values.length,
    };
  }, [state]);

  if (!ready) {
    return <Centered>화면을 준비하는 중…</Centered>;
  }
  if (error || !state) {
    return <Centered>{error || "방을 찾을 수 없습니다."}</Centered>;
  }
  if (!hostKey) {
    return (
      <Centered>
        진행자 권한이 없는 화면입니다.
        <br />
        홈에서 방을 다시 만들어 주세요.
      </Centered>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[1400px] flex-col gap-5 px-4 py-4 md:px-8 md:py-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="brand-display text-2xl text-[var(--gold)]">한판</p>
          <h1 className="mt-1 text-3xl font-bold md:text-4xl">{state.title}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-white/50">방 코드</p>
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
                  run("oxStart", {
                    question: customQ,
                    answer: customA,
                  })
                }
                onRandom={() => run("oxStart", {})}
                onReveal={() => run("oxReveal")}
                onReset={() => run("oxReset")}
              />
            ) : null}
            {state.mode === "random" ? (
              <RandomHostView
                state={state}
                winner={winner}
                pending={pending}
                onSpin={() => run("randomSpin")}
                onClear={() => run("randomClear")}
              />
            ) : null}
            {state.mode === "reaction" ? (
              <ReactionHostView
                state={state}
                winner={reactionWinner}
                pending={pending}
                onArm={() => run("reactionArm")}
                onReset={() => run("reactionReset")}
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
          <ScoreList
            players={state.players}
            highlightId={
              state.mode === "random"
                ? state.random.winnerId
                : state.mode === "reaction"
                  ? state.reaction.winnerId
                  : null
            }
          />
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
    { id: "ox", label: "O/X 경기" },
    { id: "random", label: "랜덤 선수" },
    { id: "reaction", label: "순발력" },
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
      <p className="brand-display mt-3 text-7xl text-white md:text-8xl">
        {count}
      </p>
      <p className="mt-2 text-xl text-white/70">명 등록</p>
      <p className="mt-8 max-w-md text-white/55">
        휴대폰에서 <span className="text-[var(--gold)]">{code}</span> 입력, 또는
        QR 스캔 후 닉네임으로 선수 등록하세요.
      </p>
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
            문제를 내면 선수 휴대폰에 O/X 버튼이 뜹니다.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            value={customQ}
            onChange={(e) => setCustomQ(e.target.value)}
            placeholder="직접 문제 입력 (비우면 랜덤)"
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
          <button
            type="button"
            disabled={pending}
            onClick={onStart}
            className="btn btn-primary"
          >
            이 문제로 시작
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onRandom}
            className="btn btn-ghost"
          >
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
        <p className="text-white/55">응답 {counts.total}/{state.players.length}</p>
        {ox.phase === "question" ? (
          <button
            type="button"
            disabled={pending}
            onClick={onReveal}
            className="btn btn-primary"
          >
            정답 공개
          </button>
        ) : (
          <>
            <p className="brand-display text-3xl text-[var(--gold)]">
              정답 {ox.answer}
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={onReset}
              className="btn btn-ghost"
            >
              다음 문제
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function RandomHostView({
  state,
  winner,
  pending,
  onSpin,
  onClear,
}: {
  state: RoomState;
  winner: { name: string } | null | undefined;
  pending: boolean;
  onSpin: () => void;
  onClear: () => void;
}) {
  const spinning = state.random.phase === "spinning";
  const done = state.random.phase === "result";

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <h2 className="brand-display text-4xl md:text-5xl">랜덤 선수</h2>
      <p className="mt-2 text-white/60">등록된 선수 중에서 한 명을 뽑습니다.</p>

      <div
        className={`mt-10 flex h-56 w-56 items-center justify-center rounded-full border-4 border-[var(--gold)]/50 bg-black/30 ${
          spinning ? "anim-spin" : ""
        }`}
      >
        <p className="brand-display px-4 text-3xl text-[var(--gold)] md:text-4xl">
          {spinning ? "두근…" : done && winner ? winner.name : "?"}
        </p>
      </div>

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          disabled={pending || spinning || state.players.length < 1}
          onClick={onSpin}
          className="btn btn-primary"
        >
          뽑기 시작
        </button>
        {done ? (
          <button type="button" disabled={pending} onClick={onClear} className="btn btn-ghost">
            다시
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ReactionHostView({
  state,
  winner,
  pending,
  onArm,
  onReset,
}: {
  state: RoomState;
  winner: { name: string } | null | undefined;
  pending: boolean;
  onArm: () => void;
  onReset: () => void;
}) {
  const phase = state.reaction.phase;

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <h2 className="brand-display text-4xl md:text-5xl">순발력 경기</h2>
      <p className="mt-2 text-white/60">신호가 켜지면 휴대폰을 가장 빨리!</p>

      <div className="mt-10 flex min-h-48 w-full max-w-xl items-center justify-center rounded-3xl bg-black/30 p-8">
        {phase === "idle" ? (
          <p className="text-2xl text-white/50">준비되면 시작하세요</p>
        ) : null}
        {phase === "wait" ? (
          <p className="brand-display text-5xl text-white/40">기다리세요…</p>
        ) : null}
        {phase === "go" ? (
          <p className="brand-display anim-go text-7xl text-[var(--gold)]">지금!</p>
        ) : null}
        {phase === "result" ? (
          <div className="anim-rise">
            <p className="text-white/60">1등</p>
            <p className="brand-display mt-2 text-5xl text-[var(--gold)]">
              {winner?.name ?? "?"}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-8 flex gap-3">
        {(phase === "idle" || phase === "result") && (
          <button
            type="button"
            disabled={pending || state.players.length < 1}
            onClick={onArm}
            className="btn btn-primary"
          >
            {phase === "result" ? "한 판 더" : "시작"}
          </button>
        )}
        {phase !== "idle" ? (
          <button type="button" disabled={pending} onClick={onReset} className="btn btn-ghost">
            리셋
          </button>
        ) : null}
      </div>
    </div>
  );
}
