import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MinecraftAvatar } from "@/components/minecraft-avatar";
import { ArrowRightIcon } from "@/components/icons";
import { ROLE_BADGE, formatDate } from "@/lib/format";
import { getPublicPlayer } from "@/lib/queries";
import { ROLE_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username} — Players`,
    description: `Public DemonMC player profile for ${username}.`,
  };
}

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  let decoded = username;
  try {
    decoded = decodeURIComponent(username);
  } catch {
    // Keep the raw value when it is not valid percent-encoding.
  }

  const player = (await getPublicPlayer(username)) ?? (await getPublicPlayer(decoded));

  if (!player) notFound();

  return (
    <>
      <section className="container-x pt-8 sm:pt-10">
        <Link
          href="/players"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowRightIcon width={13} height={13} className="rotate-180" />
          Back to roster
        </Link>
      </section>

      <section className="container-x pb-24 pt-5">
        <div className="panel relative overflow-hidden">
          <div className="block-motif pointer-events-none absolute inset-0 opacity-[0.12]" aria-hidden="true" />
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-ember/[0.08] blur-3xl"
            aria-hidden="true"
          />
          <div className="relative grid gap-8 p-7 sm:p-10 lg:grid-cols-[auto_1fr] lg:items-center">
            <span className="avatar-ring inline-flex self-start">
              <MinecraftAvatar username={player.username} size={168} className="!rounded-2xl" />
            </span>

            <div>
              <p className="eyebrow">Player Profile</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="headline text-4xl sm:text-5xl">{player.username}</h1>
                <span className={`badge ${ROLE_BADGE[player.role]}`}>
                  {ROLE_LABELS[player.role]}
                </span>
              </div>
              <p className="mt-3 text-sm text-zinc-400">
                Registered on the DemonMC network on{" "}
                <span className="text-zinc-200">{formatDate(player.joinedAt)}</span>.
              </p>

              <div className="mt-6 grid max-w-lg gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/[0.07] bg-ink-950/60 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Rank
                  </p>
                  <p className="mt-1.5 font-display text-sm font-semibold text-white">
                    {ROLE_LABELS[player.role]}
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-ink-950/60 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Joined
                  </p>
                  <p className="mt-1.5 font-display text-sm font-semibold text-white">
                    {formatDate(player.joinedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <section className="panel p-6 sm:p-7">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em] text-white">
              Biography
            </h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-zinc-400">
              {player.description ||
                "This player hasn't added a public biography yet. Check back soon."}
            </p>
          </section>

          <aside className="panel p-6 sm:p-7">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em] text-white">
              Public Information
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-zinc-500">Username</dt>
                <dd className="truncate font-mono text-zinc-200">{player.username}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-zinc-500">Rank</dt>
                <dd className="text-zinc-200">{ROLE_LABELS[player.role]}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-zinc-500">Joined</dt>
                <dd className="text-zinc-200">{formatDate(player.joinedAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-zinc-500">Account</dt>
                <dd className="inline-flex items-center gap-1.5 text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Active
                </dd>
              </div>
            </dl>
            <p className="mt-5 border-t border-white/[0.06] pt-4 text-[11px] leading-relaxed text-zinc-600">
              Only public profile details are displayed. Private account information is never
              shared.
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
