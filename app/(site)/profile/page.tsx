import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/avatar";
import {
  ArrowRightIcon,
  DashboardIcon,
  MegaphoneIcon,
  SettingsIcon,
  ShieldIcon,
  UsersIcon,
} from "@/components/icons";
import { ProfileSettings } from "@/components/profile-settings";
import { SignOutButton } from "@/components/sign-out";
import { getSessionUser } from "@/lib/auth";
import { ROLE_BADGE, formatDate } from "@/lib/format";
import { ROLE_LABELS, canManageAccounts, isStaffRole } from "@/lib/types";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your DemonMC account profile.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/profile");

  const staff = isStaffRole(user.role);
  const admin = canManageAccounts(user.role);
  const owner = user.role === "owner";

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
              <Avatar name={user.username} src={user.avatarUrl} size={62} />
              <div className="min-w-0">
                <h1 className="headline truncate text-3xl sm:text-4xl">Your profile</h1>
                <p className="mt-1 break-all text-sm text-zinc-400">
                  {user.email ?? user.username} · member since {formatDate(user.joinedAt)}
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
        <ProfileSettings user={user} />

        <div className="panel mt-5 p-6">
          <h2 className="font-display text-base font-semibold text-white">Account shortcuts</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link href="/dashboard" className="btn-subtle justify-between !py-2.5">
              <span className="inline-flex items-center gap-2">
                <DashboardIcon width={14} height={14} />
                Dashboard
              </span>
              <ArrowRightIcon width={14} height={14} />
            </Link>
            {staff && (
              <Link href="/staff" className="btn-subtle justify-between !py-2.5">
                <span className="inline-flex items-center gap-2">
                  <ShieldIcon width={14} height={14} />
                  Staff panel
                </span>
                <ArrowRightIcon width={14} height={14} />
              </Link>
            )}
            {admin && (
              <Link href="/admin" className="btn-subtle justify-between !py-2.5">
                <span className="inline-flex items-center gap-2">
                  <ShieldIcon width={14} height={14} />
                  Admin dashboard
                </span>
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

          <div className="mt-5 flex flex-col gap-2 border-t border-white/[0.05] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] leading-relaxed text-zinc-600">
              Signing out clears your session cookie on this device.
            </p>
            <SignOutButton className="btn-ghost !py-2.5 text-xs" />
          </div>
        </div>
      </section>
    </>
  );
}
