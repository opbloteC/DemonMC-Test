"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MinecraftAvatar } from "@/components/minecraft-avatar";
import { ArrowRightIcon, SearchIcon, UsersIcon } from "@/components/icons";
import { ROLE_BADGE, formatDate } from "@/lib/format";
import { ROLE_LABELS, type PublicPlayer, type Role } from "@/lib/types";

type Filter = "all" | Role;

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "All Players" },
  { key: "owner", label: "Owner" },
  { key: "admin", label: "Admin" },
  { key: "moderator", label: "Moderator" },
  { key: "staff", label: "Staff" },
  { key: "player", label: "Players" },
];

function PlayerCard({
  player,
  statusAvailable,
  online,
}: {
  player: PublicPlayer;
  statusAvailable: boolean;
  online: boolean;
}) {
  return (
    <article className="player-card panel panel-hover group relative flex h-full flex-col overflow-hidden p-5">
      <span className="player-card-line" aria-hidden="true" />
      <div className="player-card-glow" aria-hidden="true" />

      <Link
        href={`/players/${encodeURIComponent(player.username)}`}
        aria-label={`View ${player.username}'s profile`}
        className="absolute inset-0 z-10 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ember/60"
      />

      <div className="relative flex items-start gap-4">
        <span className="avatar-ring relative inline-flex">
          <MinecraftAvatar username={player.username} size={72} />
          {statusAvailable && (
            <span
              className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-ink-900 ${
                online ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" : "bg-zinc-600"
              }`}
              aria-hidden="true"
            />
          )}
        </span>

        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="truncate font-display text-[15px] font-semibold text-white">
            {player.username}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className={`badge ${ROLE_BADGE[player.role]}`}>{ROLE_LABELS[player.role]}</span>
            {statusAvailable && (
              <span
                className={`badge ${
                  online
                    ? "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300"
                    : "border-white/10 bg-white/[0.03] text-zinc-500"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    online ? "bg-emerald-400" : "bg-zinc-600"
                  }`}
                />
                {online ? "Online" : "Offline"}
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="relative mt-4 line-clamp-2 min-h-[2.6rem] text-sm leading-relaxed text-zinc-400">
        {player.description || "No public biography yet."}
      </p>

      <div className="relative mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500">
          Joined {formatDate(player.joinedAt)}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-semibold text-zinc-300 transition-colors group-hover:border-ember/30 group-hover:text-ember-bright">
          Profile
          <ArrowRightIcon
            width={12}
            height={12}
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </article>
  );
}

export function PlayerDirectory({
  players,
  onlineNames,
  statusAvailable,
}: {
  players: PublicPlayer[];
  onlineNames: string[];
  statusAvailable: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const onlineSet = useMemo(
    () => new Set(onlineNames.map((name) => name.toLowerCase())),
    [onlineNames],
  );

  const counts = useMemo(() => {
    const map = new Map<Filter, number>([["all", players.length]]);
    for (const player of players) {
      map.set(player.role, (map.get(player.role) ?? 0) + 1);
    }
    return map;
  }, [players]);

  const term = query.trim().toLowerCase();
  const matches = players.filter((player) => {
    if (filter !== "all" && player.role !== filter) return false;
    if (!term) return true;
    return player.username.toLowerCase().includes(term);
  });

  if (players.length === 0) {
    return (
      <div className="panel mt-10 flex flex-col items-center px-6 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-500">
          <UsersIcon width={20} height={20} />
        </span>
        <h2 className="mt-4 font-display text-lg font-semibold text-white">
          No registered players yet
        </h2>
        <p className="mt-2 max-w-sm text-sm text-zinc-500">
          Real player accounts will appear here as soon as they join the network.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-md">
          <SearchIcon
            width={16}
            height={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by Minecraft username…"
            aria-label="Search players by username"
            className="input pl-11"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => {
            const active = filter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                aria-pressed={active}
                className={`rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                  active
                    ? "border-ember/40 bg-ember/10 text-ember-bright"
                    : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-white"
                }`}
              >
                {item.label} · {counts.get(item.key) ?? 0}
              </button>
            );
          })}
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="panel mt-10 flex flex-col items-center px-6 py-14 text-center">
          <h2 className="font-display text-base font-semibold text-white">No players found</h2>
          <p className="mt-1.5 text-sm text-zinc-500">
            {term ? `Nothing matches “${query.trim()}”. Try another username.` : "No players in this category yet."}
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
            className="btn-subtle mt-5"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((player) => (
            <PlayerCard
              key={player.username}
              player={player}
              statusAvailable={statusAvailable}
              online={onlineSet.has(player.username.toLowerCase())}
            />
          ))}
        </div>
      )}
    </>
  );
}
