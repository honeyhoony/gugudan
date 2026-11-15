"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchRoom } from "@/lib/client";
import type { RoomState } from "@/lib/types";

export function useRoom(
  code: string,
  options: { playerId?: string | null; intervalMs?: number } = {},
) {
  const { playerId = null, intervalMs = 800 } = options;
  const [state, setState] = useState<RoomState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const mounted = useRef(true);
  /** Bumped on local writes so in-flight polls cannot clobber fresher UI state */
  const writeSeq = useRef(0);

  const applyLocalState = useCallback((next: RoomState) => {
    writeSeq.current += 1;
    setState(next);
  }, []);

  useEffect(() => {
    mounted.current = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function tick() {
      const seqAtStart = writeSeq.current;
      try {
        const room = await fetchRoom(code, playerId);
        if (!mounted.current) return;
        // Ignore stale responses that started before a local mutation
        if (seqAtStart !== writeSeq.current) return;
        setState(room.state);
        setError(null);
        setReady(true);
      } catch (err) {
        if (!mounted.current) return;
        if (seqAtStart !== writeSeq.current) return;
        setError(err instanceof Error ? err.message : "연결 오류");
        setReady(true);
      } finally {
        if (mounted.current) {
          timer = setTimeout(tick, intervalMs);
        }
      }
    }

    void tick();
    return () => {
      mounted.current = false;
      if (timer) clearTimeout(timer);
    };
  }, [code, playerId, intervalMs]);

  return { state, setState: applyLocalState, error, ready };
}
