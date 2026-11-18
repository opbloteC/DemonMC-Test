import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DiscordIcon, LockIcon } from "@/components/icons";
import { LogoMark, Wordmark } from "@/components/logo";
import { RegisterForm } from "@/components/register-form";
import { getSessionUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your DemonMC player account.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  const settings = await getSettings();

  return (
    <div className="hero-shell relative flex min-h-screen flex-col">
      <div className="hero-image !opacity-20" aria-hidden="true" />
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-glow" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-ink-950/40 via-ink-950/70 to-ink-950"
      />

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
        <Link
          href="/login"
          className="btn-ghost !px-4 !py-2 text-xs"
        >
          <LockIcon width={14} height={14} />
          Login
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-10 sm:py-14">
        <div className="w-full max-w-[430px] animate-fade-up">
          <div className="mb-7 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-ink-900/80 shadow-glow">
              <LogoMark size={40} />
            </div>
            <p className="eyebrow mt-5">DemonMC Network</p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Create your account
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              Join the network. Your adventure starts here.
            </p>
          </div>

          <div className="panel relative overflow-hidden p-6 sm:p-7">
            <span className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-ember/70 to-transparent" />

            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-sm font-semibold text-white">Player registration</h2>
                <p className="mt-1 text-[11px] text-zinc-600">
                  Register with your email address.
                </p>
              </div>
              <span className="badge border-white/10 bg-white/[0.03] text-zinc-400">
                <LockIcon width={12} height={12} />
                Secure
              </span>
            </div>

            <RegisterForm />

            <div className="divider my-6" />

            <div className="space-y-3 text-center text-[11px] leading-relaxed text-zinc-600">
              <p>
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-zinc-300 transition-colors hover:text-white"
                >
                  Login
                </Link>
              </p>
              <p>New accounts start with the Player role. Staff roles are assigned by the team.</p>
            </div>
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
