"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { useParams } from "next/navigation";
import {
  joinRoom,
  playCommand,
  playerStorageKey,
} from "@/lib/client";
import { useRoom } from "@/hooks/useRoom";
import { ScoreList } from "@/components/ScoreList";

type SavedPlayer = { id: string; name: string };

export default function PlayPage() {
  const params = useParams<{ code: string }>();
  const code = String(params.code || "").toUpperCase();
  const [player, setPlayer] = useState<SavedPlayer | null>(null);
  const [name, setName] = useState("");
  const [boot, setBoot] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { state, setState, error, ready } = useRoom(code, {
    playerId: player?.id,
    intervalMs: 650,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(playerStorageKey(code));
      if (raw) setPlayer(JSON.parse(raw) as SavedPlayer);
    } catch {
      // ignore
    }
    setBoot(true);
  }, [code]);

  const myAnswer = player && state ? state.ox.answers[player.id] : undefined;
  const me = useMemo(
    () => state?.players.find((p) => p.id === player?.id) ?? null,
    [state, player],
  );

  function onJoin(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      try {
        const result = await joinRoom(code, name);
        const saved = { id: result.player.id, name: result.player.name };
        localStorage.setItem(playerStorageKey(code), JSON.stringify(saved));
        setPlayer(saved);
        setState(result.state);
      } catch (err) {
        setMsg(err instanceof Error ? err.message : "입장 실패");
      }
    });
  }

  function run(action: string, payload: Record<string, unknown> = {}) {
    if (!player) return;
    setMsg(null);
    startTransition(async () => {
      try {
        const next = await playCommand(code, player.id, action, payload);
        setState(next);
      } catch (err) {
        const text = err instanceof Error ? err.message : "실패";
        if (text.includes("참가 정보")) {
          localStorage.removeItem(playerStorageKey(code));
          setPlayer(null);
        }
        setMsg(text);
      }
    });
  }

  if (!boot || !ready) {
    return <Shell>연결 중…</Shell>;
  }
  if (error && !state) {
    return <Shell>{error}</Shell>;
  }
  if (!player) {
    return (
      <Shell>
        <div className="w-full max-w-sm">
          <p className="brand-display text-3xl text-[var(--gold)]">한판</p>
          <h1 className="mt-2 text-2xl font-bold">방 {code}</h1>
          <p className="mt-1 text-sm text-white/60">닉네임을 치고 입장하세요</p>
          <form onSubmit={onJoin} className="mt-6 space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={12}
              placeholder="닉네임"
              className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-teal-300"
              autoFocus
            />
            <button
              type="submit"
              disabled={pending}
              className="btn btn-sea w-full"
            >
              {pending ? "입장 중…" : "입장"}
            </button>
          </form>
          {msg ? <p className="mt-3 text-sm text-red-200">{msg}</p> : null}
        </div>
      </Shell>
    );
  }

  if (!state) return <Shell>불러오는 중…</Shell>;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="brand-display text-xl text-[var(--gold)]">한판</p>
          <p className="text-sm text-white/55">
            {state.title} · {code}
          </p>
        </div>
        <div className="rounded-full bg-white/10 px-3 py-1 text-sm">
          {player.name}
          <span className="ml-2 font-bold text-[var(--gold)]">{me?.score ?? 0}</span>
        </div>
      </header>

      <section className="panel mt-5 flex flex-1 flex-col rounded-3xl p-5">
        {state.mode === "lobby" ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="text-white/60">대기 중</p>
            <p className="brand-display mt-3 text-5xl">{state.players.length}</p>
            <p className="mt-1 text-white/60">명과 함께</p>
            <p className="mt-6 text-sm text-white/45">
              큰 화면에서 게임이 시작되면 여기에 조작이 나타납니다.
            </p>
          </div>
        ) : null}

        {state.mode === "ox" ? (
          <OxPlay
            phase={state.ox.phase}
            question={state.ox.question}
            answer={state.ox.answer}
            myAnswer={myAnswer}
            pending={pending}
            onPick={(a) => run("oxAnswer", { answer: a })}
          />
        ) : null}

        {state.mode === "random" ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="text-white/60">랜덤 뽑기</p>
            {state.random.phase === "spinning" ? (
              <p className="brand-display mt-4 text-4xl text-[var(--gold)]">두근두근</p>
            ) : null}
            {state.random.phase === "result" ? (
              <p className="brand-display mt-4 text-4xl text-[var(--gold)]">
                {state.players.find((p) => p.id === state.random.winnerId)?.name ??
                  "?"}
              </p>
            ) : null}
            {state.random.phase === "idle" ? (
              <p className="mt-4 text-white/50">진행자가 뽑기를 시작합니다</p>
            ) : null}
            {state.random.winnerId === player.id &&
            state.random.phase === "result" ? (
              <p className="mt-4 text-lg text-teal-200">당신이 뽑혔습니다!</p>
            ) : null}
          </div>
        ) : null}

        {state.mode === "reaction" ? (
          <ReactionPlay
            phase={state.reaction.phase}
            isWinner={state.reaction.winnerId === player.id}
            winnerName={
              state.players.find((p) => p.id === state.reaction.winnerId)?.name
            }
            pending={pending}
            onTap={() => run("reactionTap")}
          />
        ) : null}
      </section>

      <section className="mt-4 rounded-2xl bg-black/20 p-4">
        <p className="mb-2 text-sm text-white/50">점수판</p>
        <ScoreList players={state.players} highlightId={player.id} compact />
      </section>

      {msg ? <p className="mt-3 text-sm text-red-200">{msg}</p> : null}
    </main>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-8">
      {children}
    </main>
  );
}

function OxPlay({
  phase,
  question,
  answer,
  myAnswer,
  pending,
  onPick,
}: {
  phase: string;
  question: string;
  answer: "O" | "X";
  myAnswer?: "O" | "X";
  pending: boolean;
  onPick: (a: "O" | "X") => void;
}) {
  if (phase === "idle") {
    return (
      <div className="flex flex-1 items-center justify-center text-center text-white/55">
        다음 문제를 기다리는 중
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <p className="text-sm text-white/50">O / X</p>
      <h2 className="mt-2 text-xl font-bold leading-snug">{question}</h2>

      {phase === "question" ? (
        myAnswer ? (
          <div className="mt-10 flex flex-1 flex-col items-center justify-center">
            <p className="text-white/60">선택 완료</p>
            <p className="brand-display mt-2 text-6xl text-[var(--gold)]">
              {myAnswer}
            </p>
          </div>
        ) : (
          <div className="mt-8 grid flex-1 grid-cols-2 gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={() => onPick("O")}
              className="btn btn-ox-o brand-display h-full min-h-36 text-5xl"
            >
              O
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => onPick("X")}
              className="btn btn-ox-x brand-display h-full min-h-36 text-5xl"
            >
              X
            </button>
          </div>
        )
      ) : (
        <div className="mt-10 flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-white/60">정답</p>
          <p className="brand-display mt-2 text-6xl text-[var(--gold)]">{answer}</p>
          {myAnswer ? (
            <p className="mt-4 text-lg">
              내 답 {myAnswer}{" "}
              {myAnswer === answer ? (
                <span className="text-teal-200">정답!</span>
              ) : (
                <span className="text-orange-200">아쉬워요</span>
              )}
            </p>
          ) : (
            <p className="mt-4 text-white/50">응답하지 않았습니다</p>
          )}
        </div>
      )}
    </div>
  );
}

function ReactionPlay({
  phase,
  isWinner,
  winnerName,
  pending,
  onTap,
}: {
  phase: string;
  isWinner: boolean;
  winnerName?: string;
  pending: boolean;
  onTap: () => void;
}) {
  if (phase === "idle") {
    return (
      <div className="flex flex-1 items-center justify-center text-white/55">
        순발력 대기
      </div>
    );
  }
  if (phase === "wait") {
    return (
      <button
        type="button"
        onClick={onTap}
        className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-white/5"
      >
        <p className="brand-display text-4xl text-white/35">기다리세요</p>
        <p className="mt-2 text-sm text-white/40">아직 누르면 안 됩니다</p>
      </button>
    );
  }
  if (phase === "go") {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={onTap}
        className="btn btn-primary anim-go flex flex-1 brand-display text-5xl"
      >
        지금!
      </button>
    );
  }
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <p className="text-white/60">결과</p>
      <p className="brand-display mt-2 text-4xl text-[var(--gold)]">
        {winnerName ?? "?"}
      </p>
      {isWinner ? (
        <p className="mt-3 text-teal-200">당신이 1등!</p>
      ) : (
        <p className="mt-3 text-white/50">다음 기회에</p>
      )}
    </div>
  );
}
