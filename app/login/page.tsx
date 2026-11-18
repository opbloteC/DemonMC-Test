import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DiscordIcon, LockIcon } from "@/components/icons";
import { LogoMark, Wordmark } from "@/components/logo";
import { LoginForm } from "@/components/login-form";
import { getSessionUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { isStaffRole } from "@/lib/types";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to the DemonMC Minecraft network.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function safeNext(value: string | string[] | undefined): string {
  if (typeof value !== "string") return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/dashboard";
  if (value.startsWith("/login")) return "/dashboard";
  return value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; registered?: string | string[] }>;
}) {
  const params = await searchParams;
  const target = safeNext(params.next);
  const registered = params.registered === "1";
  const user = await getSessionUser();

  if (user) {
    redirect(!isStaffRole(user.role) && target.startsWith("/staff") ? "/dashboard" : target);
  }

  const settings = await getSettings();

  return (
    <div className="hero-shell relative flex min-h-screen flex-col">
      <div className="hero-image !opacity-20" aria-hidden="true" />
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-glow" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-ink-950/40 via-ink-950/70 to-ink-950" aria-hidden="true" />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[8%] top-[24%] hidden h-16 w-16 rotate-12 border border-white/[0.05] bg-white/[0.015] lg:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[10%] top-[58%] hidden h-10 w-10 -rotate-6 border border-ember/20 bg-ember/[0.03] lg:block"
      />

      <header className="container-x relative z-10 flex h-20 items-center justify-between">
        <Link href="/login" className="flex items-center gap-2.5" aria-label="DemonMC">
          <LogoMark size={32} />
          <Wordmark className="text-[16px]" />
        </Link>
        <div className="flex items-center gap-3">
          <a
            href={settings.discord}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 text-xs text-zinc-500 transition-colors hover:text-white sm:inline-flex"
          >
            <DiscordIcon width={15} height={15} />
            Discord
          </a>
          <Link href="/register" className="btn-ghost !px-4 !py-2 text-xs">
            Register
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-10 sm:py-14">
        <div className="w-full max-w-[430px] animate-fade-up">
          <div className="mb-7 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-ink-900/80 shadow-glow">
              <LogoMark size={40} />
            </div>
            <p className="eyebrow mt-5">DemonMC Network</p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Welcome back
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              Sign in with your email address or username.
            </p>
          </div>

          <div className="panel relative overflow-hidden p-6 sm:p-7">
            <span className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-ember/70 to-transparent" />

            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-sm font-semibold text-white">Account access</h2>
                <p className="mt-1 text-[11px] text-zinc-600">
                  Sign in to your DemonMC account.
                </p>
              </div>
              <span className="badge border-white/10 bg-white/[0.03] text-zinc-400">
                <LockIcon width={12} height={12} />
                Secure
              </span>
            </div>

            {registered && (
              <p
                role="status"
                className="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] px-3.5 py-2.5 text-xs leading-relaxed text-emerald-300"
              >
                Account created. Sign in with your email and password.
              </p>
            )}

            <LoginForm nextPath={target} />

            <div className="divider my-6" />

            <p className="text-center text-[11px] leading-relaxed text-zinc-600">
              New to DemonMC?{" "}
              <Link
                href="/register"
                className="font-medium text-zinc-300 transition-colors hover:text-white"
              >
                Create an account
              </Link>
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-zinc-600">
            <span className="font-mono">{settings.ip}</span>
            <span className="h-3 w-px bg-white/10" aria-hidden="true" />
            <a
              href={settings.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="link-muted inline-flex items-center gap-1.5"
            >
              <DiscordIcon width={13} height={13} />
              Community Discord
            </a>
          </div>
        </div>
      </main>

      <footer className="relative z-10 pb-6 text-center text-[10px] uppercase tracking-[0.24em] text-zinc-700">
        DemonMC · Enter the world
      </footer>
    </div>
  );
}
