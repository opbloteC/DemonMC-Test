import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { SignOutButton } from "@/components/sign-out";
import {
  ArrowRightIcon,
  MegaphoneIcon,
  SettingsIcon,
  ShieldIcon,
  UsersIcon,
} from "@/components/icons";
import { getSessionUser } from "@/lib/auth";
import { ROLE_BADGE, formatDate } from "@/lib/format";
import { isStaffRole, ROLE_LABELS } from "@/lib/types";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your DemonMC account overview.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard");

  const staff = isStaffRole(user.role);
  const admin = user.role === "owner" || user.role === "admin";
  const owner = user.role === "owner";
  const email = user.email ?? "Not set";

  return (
    <>
      <section className="border-b border-white/[0.05]">
        <div className="container-x py-12 sm:py-16">
          <p className="eyebrow flex items-center gap-3">
            <span className="h-px w-8 bg-ember/70" />
            Account
          </p>
          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar name={user.username} src={user.avatarUrl} size={58} />
              <div className="min-w-0">
                <h1 className="headline truncate text-3xl sm:text-4xl">Dashboard</h1>
                <p className="mt-1 truncate text-sm text-zinc-400">
                  Signed in as <span className="text-zinc-200">{user.username}</span>
                </p>
              </div>
            </div>
            <span className={`badge w-fit ${ROLE_BADGE[user.role]}`}>
              <ShieldIcon width={12} height={12} />
              {ROLE_LABELS[user.role]}
            </span>
          </div>
        </div>
      </section>

      <section className="container-x py-10 sm:py-12">
        <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
          <div className="panel p-6 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-white">Account information</h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Details stored on your DemonMC account.
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-ember">
                <ShieldIcon width={18} height={18} />
              </span>
            </div>

            <dl className="mt-6 grid gap-4 border-t border-white/[0.05] pt-5 sm:grid-cols-2">
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                  Email
                </dt>
                <dd className="mt-1 break-all text-sm text-zinc-200">{email}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                  Username
                </dt>
                <dd className="mt-1 break-all text-sm text-zinc-200">{user.username}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                  Role
                </dt>
                <dd className="mt-1 text-sm text-zinc-200">{ROLE_LABELS[user.role]}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                  Member since
                </dt>
                <dd className="mt-1 text-sm text-zinc-200">{formatDate(user.joinedAt)}</dd>
              </div>
            </dl>

            {user.description && (
              <p className="mt-5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 text-xs leading-relaxed text-zinc-400">
                {user.description}
              </p>
            )}

            <p className="mt-5 text-[11px] leading-relaxed text-zinc-600">
              Your password is stored as a bcrypt hash. It is never sent back to the browser.
            </p>
          </div>

          <div className="space-y-5">
            <div className="panel p-6">
              <h2 className="font-display text-base font-semibold text-white">Session</h2>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                You are signed in with a secure HttpOnly session cookie. It expires after seven days
                or when you sign out.
              </p>
              <SignOutButton className="btn-ghost mt-5 w-full !py-2.5 text-xs" />
            </div>

            <div className="panel p-6">
              <h2 className="font-display text-base font-semibold text-white">Shortcuts</h2>
              <div className="mt-4 flex flex-col gap-2">
                <Link href="/profile" className="btn-subtle justify-between !py-2.5">
                  <span className="inline-flex items-center gap-2">
                    <ShieldIcon width={14} height={14} />
                    Profile
                  </span>
                  <ArrowRightIcon width={14} height={14} />
                </Link>
                {admin && (
                  <Link href="/admin" className="btn-subtle justify-between !py-2.5">
                    Admin dashboard
                    <ArrowRightIcon width={14} height={14} />
                  </Link>
                )}
                {owner && (
                  <Link href="/owner" className="btn-subtle justify-between !py-2.5">
                    <span className="inline-flex items-center gap-2">
                      <SettingsIcon width={14} height={14} />
                      Owner console
                    </span>
                    <ArrowRightIcon width={14} height={14} />
                  </Link>
                )}
                {staff && (
                  <Link href="/staff" className="btn-subtle justify-between !py-2.5">
                    Staff Panel
                    <ArrowRightIcon width={14} height={14} />
                  </Link>
                )}
                <Link href="/players" className="btn-subtle justify-between !py-2.5">
                  <span className="inline-flex items-center gap-2">
                    <UsersIcon width={14} height={14} />
                    Players
                  </span>
                  <ArrowRightIcon width={14} height={14} />
                </Link>
                <Link href="/announcements" className="btn-subtle justify-between !py-2.5">
                  <span className="inline-flex items-center gap-2">
                    <MegaphoneIcon width={14} height={14} />
                    Announcements
                  </span>
                  <ArrowRightIcon width={14} height={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
