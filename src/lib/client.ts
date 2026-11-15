"use client";

import type { HostCreateResponse, PublicRoom, RoomState } from "@/lib/types";

export async function createRoom(title: string): Promise<HostCreateResponse> {
  const res = await fetch("/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "방 만들기 실패");
  return data as HostCreateResponse;
}

export async function fetchRoom(
  code: string,
  playerId?: string | null,
): Promise<PublicRoom> {
  const q = playerId ? `?playerId=${encodeURIComponent(playerId)}` : "";
  const res = await fetch(`/api/rooms/${encodeURIComponent(code)}${q}`, {
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "방 조회 실패");
  return data as PublicRoom;
}

export async function joinRoom(
  code: string,
  name: string,
): Promise<{ player: { id: string; name: string }; state: RoomState }> {
  const res = await fetch(`/api/rooms/${encodeURIComponent(code)}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "입장 실패");
  return data;
}

export async function hostCommand(
  code: string,
  hostKey: string,
  action: string,
  payload: Record<string, unknown> = {},
): Promise<RoomState> {
  const res = await fetch(`/api/rooms/${encodeURIComponent(code)}/host`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hostKey, action, payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "진행 실패");
  return data.state as RoomState;
}

export async function playCommand(
  code: string,
  playerId: string,
  action: string,
  payload: Record<string, unknown> = {},
): Promise<RoomState> {
  const res = await fetch(`/api/rooms/${encodeURIComponent(code)}/play`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId, action, payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "참여 실패");
  return data.state as RoomState;
}

export function hostStorageKey(code: string) {
  return `hanpan-host:${code.toUpperCase()}`;
}

export function playerStorageKey(code: string) {
  return `hanpan-player:${code.toUpperCase()}`;
}
