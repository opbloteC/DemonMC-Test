"use client";

import { useEffect, useState } from "react";
import { CubeIcon, UsersIcon } from "@/components/icons";
import type { ServerStatus } from "@/lib/types";

export function ServerStatusLine({ initial }: { initial: ServerStatus }) {
  const [status, setStatus] = useState<ServerStatus>(initial);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const res = await fetch("/api/status", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as ServerStatus;
        if (!cancelled) setStatus(data);
      } catch {
        // keep the last known status; the next poll will retry
      }
    }

    const interval = setInterval(refresh, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const unavailable = !status.reachable;
  const online = status.online;

  return (
    <div className="inline-flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-full border border-white/[0.07] bg-ink-900/60 px-5 py-2.5 text-xs backdrop-blur">
      <span className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          {online && !unavailable && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${
              unavailable ? "bg-zinc-500" : online ? "bg-emerald-400" : "bg-ember"
            }`}
          />
        </span>
        <span className="font-semibold uppercase tracking-[0.16em] text-zinc-200">
          {unavailable ? "Status unavailable" : online ? "Online" : "Offline"}
        </span>
      </span>

      {!unavailable && status.players && (
        <span className="flex items-center gap-1.5 text-zinc-400">
          <UsersIcon width={13} height={13} className="text-zinc-500" />
          <span className="font-mono text-zinc-200">{status.players.online}</span>
          <span className="text-zinc-600">/</span>
          <span className="font-mono text-zinc-400">{status.players.max}</span>
          <span>playing</span>
        </span>
      )}

      {!unavailable && status.version && (
        <span className="flex items-center gap-1.5 text-zinc-500">
          <CubeIcon width={13} height={13} />
          {status.version}
        </span>
      )}
    </div>
  );
}
