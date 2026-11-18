import type { PlayerCategory } from "./types";

export function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function avatarFor(username: string, custom?: string | null): string {
  if (custom) return custom;
  return `https://mc-heads.net/avatar/${encodeURIComponent(username)}/96`;
}

export const ROLE_BADGE: Record<PlayerCategory, string> = {
  owner: "border-ember/40 bg-ember/10 text-ember-bright",
  admin: "border-red-300/25 bg-red-300/[0.08] text-red-200",
  moderator: "border-amber-300/25 bg-amber-300/[0.08] text-amber-200",
  staff: "border-emerald-300/25 bg-emerald-300/[0.08] text-emerald-200",
  helper: "border-sky-300/25 bg-sky-300/[0.08] text-sky-200",
  developer: "border-violet-300/25 bg-violet-300/[0.08] text-violet-200",
  player: "border-white/10 bg-white/[0.04] text-zinc-300",
};
