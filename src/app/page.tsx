"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { createRoom, hostStorageKey } from "@/lib/client";
import { EVENT_FULL, EVENT_ORG } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [title, setTitle] = useState(EVENT_FULL);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const room = await createRoom(title);
        localStorage.setItem(hostStorageKey(room.code), room.hostKey);
        router.push(`/host/${room.code}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "방 만들기 실패");
      }
    });
  }

  function onJoin(e: FormEvent) {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) {
      setError("방 코드 4자리를 입력해 주세요.");
      return;
    }
    router.push(`/play/${code}`);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 pb-10 pt-8 md:px-10 md:pt-12">
      <header className="anim-rise flex items-center justify-between gap-3">
        <p className="brand-display text-3xl text-[var(--gold)] md:text-4xl">
          한판
        </p>
        <p className="text-right text-sm text-white/55 md:text-base">
          {EVENT_ORG}
        </p>
      </header>

      <section className="mt-10 grid flex-1 items-center gap-10 md:mt-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="anim-rise-delay">
          <p className="brand-display text-2xl text-[var(--gold)] md:text-3xl">
            한판
          </p>
          <h1 className="brand-display mt-2 max-w-xl text-5xl leading-[1.08] text-white md:text-7xl">
            온라인
            <br />
            체육대회
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-white/75 md:text-xl">
            프로젝터는 경기장, 휴대폰은 선수 컨트롤러.
            <br />
            O/X · 랜덤 선수 · 순발력 경기를 다같이.
          </p>
        </div>

        <div className="anim-rise space-y-4">
          <form onSubmit={onCreate} className="panel rounded-3xl p-6 md:p-7">
            <p className="text-sm font-medium text-[var(--gold)]">진행자 · 심판</p>
            <h2 className="mt-1 text-xl font-bold">대회장 열고 큰 화면에</h2>
            <label className="mt-5 block text-sm text-white/65">대회 이름</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 outline-none ring-[var(--gold)] focus:ring-2"
              maxLength={40}
              placeholder={EVENT_FULL}
            />
            <button
              type="submit"
              disabled={pending}
              className="btn btn-primary anim-glow mt-5 w-full"
            >
              {pending ? "여는 중…" : "대회 시작"}
            </button>
          </form>

          <form onSubmit={onJoin} className="panel rounded-3xl p-6 md:p-7">
            <p className="text-sm font-medium text-teal-200">선수</p>
            <h2 className="mt-1 text-xl font-bold">휴대폰으로 입장</h2>
            <label className="mt-5 block text-sm text-white/65">입장 코드</label>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 tracking-[0.35em] outline-none ring-teal-300 focus:ring-2"
              maxLength={6}
              placeholder="ABCD"
              autoCapitalize="characters"
            />
            <button type="submit" className="btn btn-sea mt-5 w-full">
              선수 등록
            </button>
          </form>

          {error ? (
            <p className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-100">
              {error}
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
