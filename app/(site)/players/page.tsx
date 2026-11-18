import type { Metadata } from "next";
import { PlayerDirectory } from "@/components/player-directory";
import { MinecraftAvatar } from "@/components/minecraft-avatar";
import { getServerStatus } from "@/lib/minecraft";
import { listPublicPlayers } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Players",
  description: "The DemonMC network roster — meet the players and staff behind the server.",
};

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const players = await listPublicPlayers();
  const settings = await getSettings();
  const status = await getServerStatus(settings.ip);

  const statusAvailable = status.reachable;
  const onlineNames = (status.players?.names ?? []).map((name) => name.toLowerCase());

  return (
    <>
      <section className="hero-shell border-b border-white/[0.05]">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-glow" aria-hidden="true" />
        <div className="container-x relative py-14 sm:py-16">
          <p className="eyebrow flex items-center gap-3">
            <span className="h-px w-8 bg-ember/70" />
            Network Roster
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-4">
            <h1 className="headline text-4xl sm:text-5xl">
              The <span className="text-ember text-ember-glow">Players</span>
            </h1>
            <span className="mb-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[11px] text-zinc-400">
              {players.length} registered
            </span>
            {statusAvailable && status.players && (
              <span className="mb-1.5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[11px] text-zinc-400">
                <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-400" />
                {status.players.online} / {status.players.max} online
              </span>
            )}
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Every account here is a real DemonMC player. Browse the roster, filter by rank, and open
            a public profile to see who is building their legacy on the network.
          </p>

          {players.length > 0 && (
            <div className="mt-8 flex items-center">
              {players.slice(0, 8).map((player, index) => (
                <span
                  key={player.username}
                  className="-ml-2 first:ml-0 inline-flex rounded-xl border border-ink-950"
                  style={{ zIndex: 8 - index }}
                  title={player.username}
                >
                  <MinecraftAvatar username={player.username} size={34} className="!rounded-lg" />
                </span>
              ))}
              {players.length > 8 && (
                <span className="-ml-2 inline-flex h-[34px] items-center rounded-full border border-white/10 bg-ink-900 px-3 font-mono text-[10px] text-zinc-400">
                  +{players.length - 8}
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="container-x pb-24 pt-10">
        <PlayerDirectory
          players={players}
          onlineNames={onlineNames}
          statusAvailable={statusAvailable}
        />
      </section>
    </>
  );
}
