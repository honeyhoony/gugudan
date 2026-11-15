"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useParams } from "next/navigation";
import { PowerMeter } from "@/components/PowerMeter";
import { TREASURE_SPOTS } from "@/lib/content";
import {
  joinRoom,
  playCommand,
  playerStorageKey,
} from "@/lib/client";
import { useRoom } from "@/hooks/useRoom";
import { ScoreList } from "@/components/ScoreList";
import { badgeLabel, formatKwh, kwhBadge, readingAt } from "@/lib/kwh";

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
  const myGuess =
    player && state ? state.treasure.guesses[player.id] : undefined;
  const myLane =
    player && state ? state.ladder.picks[player.id] : undefined;
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

  if (!boot || !ready) return <Shell>연결 중…</Shell>;
  if (error && !state) return <Shell>{error}</Shell>;

  if (!player) {
    return (
      <Shell>
        <div className="w-full max-w-sm">
          <p className="brand-display text-3xl text-[var(--gold)]">한판</p>
          <h1 className="mt-2 text-2xl font-bold">방 {code}</h1>
          <p className="mt-1 text-sm text-white/60">선수 이름으로 등록하세요</p>
          <form onSubmit={onJoin} className="mt-6 space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={12}
              placeholder="선수 이름"
              className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-teal-300"
              autoFocus
            />
            <button type="submit" disabled={pending} className="btn btn-sea w-full">
              {pending ? "등록 중…" : "선수 등록"}
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
          <span className="ml-2 font-bold text-[var(--gold)]">
            {me?.score ?? 0}
          </span>
        </div>
      </header>

      <section className="panel mt-5 flex flex-1 flex-col rounded-3xl p-5">
        {state.mode === "lobby" ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="text-white/60">개회 대기</p>
            <p className="brand-display mt-3 text-5xl">{state.players.length}</p>
            <p className="mt-1 text-white/60">명 선수</p>
            <p className="mt-6 text-sm text-white/45">
              큰 화면에서 경기가 시작되면 여기에 조작이 나타납니다.
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

        {state.mode === "treasure" ? (
          <TreasurePlay
            phase={state.treasure.phase}
            clue={state.treasure.clue}
            spotId={state.treasure.spotId}
            myGuess={myGuess}
            pending={pending}
            onPick={(spotId) => run("treasureGuess", { spotId })}
          />
        ) : null}

        {state.mode === "ladder" ? (
          <LadderPlay
            phase={state.ladder.phase}
            laneCount={state.ladder.laneCount}
            picks={state.ladder.picks}
            myLane={myLane}
            mapping={state.ladder.mapping}
            results={state.ladder.results}
            pending={pending}
            onPick={(lane) => run("ladderPick", { lane })}
          />
        ) : null}

        {state.mode === "mash" ? (
          <MashPlay
            phase={state.mash.phase}
            endsAt={state.mash.endsAt}
            myCount={player ? state.mash.counts[player.id] ?? 0 : 0}
            onBurst={(count) => run("mashTap", { count })}
          />
        ) : null}

        {state.mode === "mole" ? (
          <MolePlay
            phase={state.mole.phase}
            slots={state.mole.slots}
            activeSlot={state.mole.activeSlot}
            myHits={player ? state.mole.hits[player.id] ?? 0 : 0}
            pending={pending}
            onHit={(slot) => run("moleHit", { slot })}
          />
        ) : null}

        {state.mode === "kwh" ? (
          <KwhPlay
            phase={state.kwh.phase}
            target={state.kwh.target}
            endsAt={state.kwh.endsAt}
            startedAt={state.kwh.startedAt}
            myStop={player ? state.kwh.stops[player.id] : undefined}
            pending={pending}
            onStop={() => run("kwhStop")}
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
        다음 O/X 문제를 기다리는 중
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

function TreasurePlay({
  phase,
  clue,
  spotId,
  myGuess,
  pending,
  onPick,
}: {
  phase: string;
  clue: string;
  spotId: string;
  myGuess?: string;
  pending: boolean;
  onPick: (spotId: string) => void;
}) {
  if (phase === "idle") {
    return (
      <div className="flex flex-1 items-center justify-center text-white/55">
        오봉산 보물찾기 대기
      </div>
    );
  }

  const answerLabel =
    TREASURE_SPOTS.find((s) => s.id === spotId)?.label ?? spotId;
  const myLabel = TREASURE_SPOTS.find((s) => s.id === myGuess)?.label;

  return (
    <div className="flex flex-1 flex-col">
      <p className="text-sm text-white/50">오봉산 보물찾기</p>
      <h2 className="mt-2 text-lg font-bold leading-snug">{clue}</h2>
      {phase === "clue" ? (
        myGuess ? (
          <div className="mt-10 flex flex-1 flex-col items-center justify-center">
            <p className="text-white/60">선택 완료</p>
            <p className="brand-display mt-2 text-4xl text-[var(--gold)]">
              {myLabel}
            </p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-2">
            {TREASURE_SPOTS.map((spot) => (
              <button
                key={spot.id}
                type="button"
                disabled={pending}
                onClick={() => onPick(spot.id)}
                className="btn btn-ghost min-h-16"
              >
                {spot.label}
              </button>
            ))}
          </div>
        )
      ) : (
        <div className="mt-10 flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-white/60">보물 위치</p>
          <p className="brand-display mt-2 text-4xl text-[var(--gold)]">
            {answerLabel}
          </p>
          {myGuess ? (
            <p className="mt-4">
              내 선택 {myLabel}{" "}
              {myGuess === spotId ? (
                <span className="text-teal-200">정답!</span>
              ) : (
                <span className="text-orange-200">아쉬워요</span>
              )}
            </p>
          ) : (
            <p className="mt-4 text-white/50">선택하지 않았습니다</p>
          )}
        </div>
      )}
    </div>
  );
}

function KwhPlay({
  phase,
  target,
  endsAt,
  startedAt,
  myStop,
  pending,
  onStop,
}: {
  phase: string;
  target: number;
  endsAt: number | null;
  startedAt: number | null;
  myStop?: number;
  pending: boolean;
  onStop: () => void;
}) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (phase !== "play" && phase !== "countdown") return;
    const id = setInterval(() => setTick((n) => n + 1), 50);
    return () => clearInterval(id);
  }, [phase]);

  if (phase === "idle") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center text-white/55">
        <p>목표 전력 {target.toFixed(2)} kWh 사수</p>
        <p className="mt-2 text-sm">진행자가 계측을 시작하면 시작됩니다</p>
      </div>
    );
  }

  if (phase === "countdown") {
    const remain = endsAt ? Math.max(1, Math.ceil((endsAt - Date.now()) / 1000)) : 3;
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="text-white/50">계측 준비</p>
        <p className="brand-display anim-go mt-2 text-7xl text-[var(--gold)]">{remain}</p>
        <p className="mt-3 text-sm text-white/60">감각으로 5.00을 노리세요</p>
      </div>
    );
  }

  if (myStop != null && myStop >= 0) {
    const badge = kwhBadge(myStop, target);
    return (
      <div className="flex flex-1 flex-col justify-center gap-4">
        <PowerMeter value={myStop} target={target} label="내 차단 전력" />
        <p className="text-center text-lg text-[var(--gold)]">{badgeLabel(badge)}</p>
        <p className="text-center text-sm text-white/50">
          {phase === "reveal" ? "결과 공개됨 · 큰 화면 확인!" : "다른 선수 대기 중…"}
        </p>
      </div>
    );
  }

  if (phase === "reveal") {
    return (
      <div className="flex flex-1 items-center justify-center text-white/55">
        STOP하지 못했습니다
      </div>
    );
  }

  const live = startedAt ? readingAt(startedAt) : 0;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <p className="text-sm text-white/50">
        목표 {formatKwh(target)} kWh · 감각으로 STOP!
      </p>
      <PowerMeter value={live} hidden target={target} label="스마트 전력량계" />
      <button
        type="button"
        disabled={pending}
        onClick={onStop}
        className="btn btn-primary flex min-h-28 flex-1 brand-display text-4xl"
      >
        STOP
        <span className="ml-2 text-lg font-sans font-semibold">차단/저장</span>
      </button>
    </div>
  );
}

function MashPlay({
  phase,
  endsAt,
  myCount,
  onBurst,
}: {
  phase: string;
  endsAt: number | null;
  myCount: number;
  onBurst: (count: number) => void;
}) {
  const [local, setLocal] = useState(0);
  const pendingRef = useRef(0);
  const onBurstRef = useRef(onBurst);
  onBurstRef.current = onBurst;

  useEffect(() => {
    setLocal((v) => Math.max(v, myCount));
  }, [myCount]);

  useEffect(() => {
    if (phase !== "play") {
      pendingRef.current = 0;
      return;
    }
    const id = setInterval(() => {
      const n = pendingRef.current;
      if (n <= 0) return;
      pendingRef.current = 0;
      onBurstRef.current(n);
    }, 180);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "countdown" || phase === "idle") setLocal(0);
  }, [phase]);

  if (phase === "idle") {
    return (
      <div className="flex flex-1 items-center justify-center text-white/55">
        연타 대기 · READY?
      </div>
    );
  }
  if (phase === "countdown") {
    const remain = endsAt ? Math.max(1, Math.ceil((endsAt - Date.now()) / 1000)) : 3;
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="brand-display anim-go text-7xl text-[var(--gold)]">{remain}</p>
        <p className="mt-2 text-white/60">손가락 준비!!</p>
      </div>
    );
  }
  if (phase === "result") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-white/60">내 연타</p>
        <p className="brand-display mt-2 text-6xl text-[var(--gold)]">{local}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <p className="text-center text-sm text-white/50">지금 연타!!</p>
      <p className="brand-display text-center text-5xl text-[var(--gold)]">{local}</p>
      <button
        type="button"
        className="btn btn-primary mt-4 flex flex-1 brand-display text-5xl active:scale-95"
        onPointerDown={(e) => {
          e.preventDefault();
          setLocal((v) => v + 1);
          pendingRef.current += 1;
        }}
      >
        팡!!
      </button>
    </div>
  );
}

function MolePlay({
  phase,
  slots,
  activeSlot,
  myHits,
  pending,
  onHit,
}: {
  phase: string;
  slots: number;
  activeSlot: number | null;
  myHits: number;
  pending: boolean;
  onHit: (slot: number) => void;
}) {
  if (phase === "idle") {
    return (
      <div className="flex flex-1 items-center justify-center text-white/55">
        대기전력 잡기 대기
      </div>
    );
  }
  if (phase === "result") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-white/60">처치한 대기전력</p>
        <p className="brand-display mt-2 text-6xl text-[var(--gold)]">{myHits}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <p className="text-sm text-white/50">빨간 ON 을 터치!</p>
      <p className="mt-1 text-[var(--gold)]">내 처치 {myHits}</p>
      <div className="mt-4 grid flex-1 grid-cols-3 gap-2">
        {Array.from({ length: slots }, (_, i) => {
          const on = activeSlot === i;
          return (
            <button
              key={i}
              type="button"
              disabled={pending}
              onClick={() => onHit(i)}
              className={`rounded-2xl text-lg font-bold transition active:scale-95 ${
                on
                  ? "btn-ox-x anim-go min-h-20"
                  : "min-h-20 bg-black/30 text-white/30"
              }`}
            >
              {on ? "ON" : "off"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LadderPlay({
  phase,
  laneCount,
  picks,
  myLane,
  mapping,
  results,
  pending,
  onPick,
}: {
  phase: string;
  laneCount: number;
  picks: Record<string, number>;
  myLane?: number;
  mapping: Record<number, number>;
  results: string[];
  pending: boolean;
  onPick: (lane: number) => void;
}) {
  if (phase === "idle") {
    return (
      <div className="flex flex-1 items-center justify-center text-white/55">
        태양광 사다리 대기
      </div>
    );
  }

  if (phase === "picking") {
    return (
      <div className="flex flex-1 flex-col">
        <p className="text-sm text-white/50">태양광 패널 레인 선택</p>
        <p className="mt-1 text-white/70">비어 있는 레인을 고르세요</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          {Array.from({ length: laneCount }, (_, i) => {
            const takenByOther = Object.entries(picks).some(
              ([, lane]) => lane === i && myLane !== i,
            );
            const mine = myLane === i;
            return (
              <button
                key={i}
                type="button"
                disabled={pending || takenByOther}
                onClick={() => onPick(i)}
                className={`btn min-h-14 ${
                  mine ? "btn-primary" : takenByOther ? "btn-ghost opacity-40" : "btn-ghost"
                }`}
              >
                {i + 1}번 패널
                {mine ? " ✓" : takenByOther ? " (점유)" : ""}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (phase === "running") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="brand-display text-4xl text-[var(--gold)]">전류 흐르는 중</p>
        <p className="mt-2 text-white/55">큰 화면을 보세요</p>
      </div>
    );
  }

  const end = myLane != null ? mapping[myLane] : undefined;
  const result = end != null ? results[end] : null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <p className="text-white/60">내 결과</p>
      <p className="brand-display mt-2 text-4xl text-[var(--gold)]">
        {result ?? "관전"}
      </p>
      {myLane != null ? (
        <p className="mt-3 text-white/50">{myLane + 1}번 패널에서 출발</p>
      ) : null}
    </div>
  );
}
