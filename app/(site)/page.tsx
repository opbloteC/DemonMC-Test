import Link from "next/link";
import { AnnouncementCard } from "@/components/announcement-card";
import { CopyIp } from "@/components/copy-ip";
import { LoginForm } from "@/components/login-form";
import { RegisterForm } from "@/components/register-form";
import { ServerStatusLine } from "@/components/server-status";
import { SectionHeading } from "@/components/section-heading";
import { SignOutButton } from "@/components/sign-out";
import { LogoMark, Wordmark } from "@/components/logo";
import {
  ArrowRightIcon,
  CubeIcon,
  DiscordIcon,
  ExternalIcon,
  MegaphoneIcon,
  ShieldIcon,
  UsersIcon,
} from "@/components/icons";
import { getSessionUser } from "@/lib/auth";
import { getServerStatus } from "@/lib/minecraft";
import { listAnnouncements } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { canManageAccounts, isStaffRole, ROLE_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: CubeIcon,
    title: "Seasonal Lifesteal",
    copy: "New seasons, fresh starts and a competitive pace that never lets up.",
  },
  {
    icon: UsersIcon,
    title: "Community first",
    copy: "A network built around its players — with a Discord where everyone gathers.",
  },
  {
    icon: ShieldIcon,
    title: "Always in sync",
    copy: "Live status, roster, staff and news, pulled straight from the network.",
  },
];

export default async function HomePage() {
  const settings = await getSettings();
  const announcements = await listAnnouncements(3);
  const status = await getServerStatus(settings.ip);
  const user = await getSessionUser();

  const inviteLabel = settings.discord
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  return (
    <>
      <section className="hero-shell">
        <div className="hero-image" aria-hidden="true" />
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-fade" aria-hidden="true" />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[7%] top-[26%] hidden h-14 w-14 rotate-12 border border-white/[0.06] bg-white/[0.015] animate-float lg:block"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[8%] top-[34%] hidden h-10 w-10 -rotate-6 border border-ember/20 bg-ember/[0.03] animate-float [animation-delay:1.5s] lg:block"
        />

        <div className="container-x relative flex min-h-[calc(100svh-72px)] flex-col items-center justify-center py-20 text-center sm:py-24">
          <div className="animate-fade-up badge border-white/10 bg-white/[0.04] text-zinc-400">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-ember" />
            Minecraft Network · Java Edition
          </div>

          <div className="mt-8 flex items-center gap-4 animate-fade-up [animation-delay:80ms]">
            <LogoMark size={58} />
            <div className="text-left">
              <Wordmark className="text-4xl sm:text-5xl" />
              <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.42em] text-zinc-500">
                Network
              </p>
            </div>
          </div>

          <h1 className="headline mt-8 max-w-4xl text-[2.35rem] leading-[0.98] animate-fade-up [animation-delay:150ms] sm:text-6xl lg:text-[4.6rem]">
            The Biggest <span className="text-ember text-ember-glow">Minecraft</span>
            <br className="hidden sm:block" /> Network
          </h1>

          <p className="mt-5 max-w-xl text-base text-zinc-400 animate-fade-up [animation-delay:220ms] sm:text-lg">
            {settings.subtitle}
          </p>

          <div className="mt-9 flex w-full flex-col items-center gap-4 animate-fade-up [animation-delay:290ms]">
            <CopyIp ip={settings.ip} />

            <div className="flex flex-wrap justify-center gap-3">
              <a
                href={settings.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <DiscordIcon width={17} height={17} />
                Join Discord
              </a>
              <Link href="/players" className="btn-ghost group">
                Explore Players
                <ArrowRightIcon
                  width={16}
                  height={16}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Link>
            </div>

            <ServerStatusLine initial={status} />
          </div>
        </div>
      </section>

      <section id="account" className="container-x py-20 sm:py-24">
        <SectionHeading
          eyebrow="Accounts"
          title={user ? "Your account" : "Sign in or create an account"}
          description={
            user
              ? "Your session, dashboard and staff tools are one click away."
              : "Both forms submit to the live server and PostgreSQL. Registration creates a real Player account."
          }
        />

        {user ? (
          <div className="panel mt-10 overflow-hidden">
            <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div>
                <p className="eyebrow">Signed in</p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-white">
                  Welcome back, {user.username}
                </h3>
                <p className="mt-1.5 text-sm text-zinc-400">
                  {user.email ?? "No email on file"} ·{" "}
                  <span className="text-ember-bright">{ROLE_LABELS[user.role]}</span>
                </p>
              </div>
              <SignOutButton className="btn-ghost" />
            </div>

            <div className="flex flex-wrap gap-2.5 border-t border-white/[0.06] bg-white/[0.015] p-6 sm:px-8">
              <Link href="/dashboard" className="btn-primary">
                Open dashboard
              </Link>
              <Link href="/profile" className="btn-ghost">
                Profile
              </Link>
              <Link href="/players" className="btn-ghost">
                Players
              </Link>
              <Link href="/announcements" className="btn-ghost">
                Announcements
              </Link>
              {isStaffRole(user.role) && (
                <Link href="/staff" className="btn-ghost">
                  Staff panel
                </Link>
              )}
              {canManageAccounts(user.role) && (
                <Link href="/admin" className="btn-ghost">
                  Admin dashboard
                </Link>
              )}
              {user.role === "owner" && (
                <Link href="/owner" className="btn-ghost">
                  Owner console
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            <div className="panel p-6 sm:p-7">
              <p className="eyebrow">Sign in</p>
              <h3 className="mt-2 font-display text-xl font-semibold text-white">Welcome back</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
                Use the email you registered with, or your username.
              </p>
              <LoginForm autoFocus={false} />
              <p className="mt-4 text-xs text-zinc-500">
                No account yet?{" "}
                <Link href="/register" className="text-ember-bright hover:underline">
                  Create one
                </Link>
                .
              </p>
            </div>

            <div className="panel p-6 sm:p-7">
              <p className="eyebrow">Create account</p>
              <h3 className="mt-2 font-display text-xl font-semibold text-white">Join the network</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
                Registration creates a real Player account in PostgreSQL.
              </p>
              <RegisterForm autoFocus={false} />
              <p className="mt-4 text-xs text-zinc-500">
                Already registered?{" "}
                <Link href="/login" className="text-ember-bright hover:underline">
                  Sign in
                </Link>
                .
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="container-x py-20 sm:py-24">
        <SectionHeading
          eyebrow="The Network"
          title="Built for the long game"
          description="Competitive Minecraft with a community behind it. Everything DemonMC, in one place."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="panel panel-hover group p-6 animate-fade-up"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-ember">
                    <Icon width={18} height={18} />
                  </span>
                  <span className="font-mono text-[10px] text-zinc-700">0{index + 1}</span>
                </div>
                <h3 className="mt-5 font-display text-base font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{feature.copy}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="container-x pb-20 sm:pb-24">
        <SectionHeading
          eyebrow="News"
          title="Latest announcements"
          description="Updates, events and news straight from the network."
          action={
            <Link href="/announcements" className="btn-subtle group">
              All announcements
              <ArrowRightIcon
                width={13}
                height={13}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
          }
        />

        {announcements.length > 0 ? (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {announcements.map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} clamped />
            ))}
          </div>
        ) : (
          <div className="panel mt-8 flex flex-col items-center px-6 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-500">
              <MegaphoneIcon width={20} height={20} />
            </span>
            <h3 className="mt-4 font-display text-lg font-semibold text-white">
              No announcements yet
            </h3>
            <p className="mt-2 max-w-sm text-sm text-zinc-500">
              Updates from DemonMC will appear here as soon as they are published.
            </p>
          </div>
        )}
      </section>

      <section className="container-x pb-24">
        <div className="panel relative overflow-hidden">
          <div className="block-motif pointer-events-none absolute inset-0 opacity-20" aria-hidden="true" />
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-ember/[0.07] blur-3xl" aria-hidden="true" />
          <div className="relative grid gap-9 p-7 sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <p className="eyebrow flex items-center gap-3">
                <span className="h-px w-8 bg-ember/70" />
                Community
              </p>
              <h2 className="mt-3 font-display text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
                More than a server
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
                Announcements, events, teammates and everything in between — the DemonMC community
                lives in Discord. Pull up a chair.
              </p>
              <a
                href={settings.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary mt-6"
              >
                <DiscordIcon width={17} height={17} />
                Join the Discord
              </a>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-ink-950/70 p-5">
              <div className="flex items-center gap-3.5">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#5865F2]/15 text-[#a5adff]">
                  <DiscordIcon width={22} height={22} />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-sm font-semibold text-white">DemonMC Discord</p>
                  <p className="mt-0.5 truncate font-mono text-xs text-zinc-500">{inviteLabel}</p>
                </div>
              </div>
              <div className="divider my-4" />
              <p className="text-xs leading-relaxed text-zinc-500">
                Open invite — jump in and say hello.
              </p>
              <a
                href={settings.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost mt-4 w-full !py-2.5 text-xs"
              >
                Accept invite
                <ExternalIcon width={14} height={14} />
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
