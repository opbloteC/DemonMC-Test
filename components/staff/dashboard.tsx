"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { LogoMark, Wordmark } from "@/components/logo";
import {
  DashboardIcon,
  ExternalIcon,
  LockIcon,
  LogoutIcon,
  MegaphoneIcon,
  SettingsIcon,
  ShieldIcon,
  UsersIcon,
} from "@/components/icons";
import { ROLE_LABELS, type SessionUser } from "@/lib/types";
import { AccountTab } from "./account-tab";
import { AccountsTab } from "./accounts-tab";
import { AnnouncementsTab } from "./announcements-tab";
import { OverviewTab } from "./overview-tab";
import { PlayersTab } from "./players-tab";
import { SettingsTab } from "./settings-tab";
import type { Notify } from "./ui";

export type TabId =
  | "overview"
  | "players"
  | "accounts"
  | "announcements"
  | "account"
  | "settings";

const TABS = [
  { id: "overview", label: "Overview", icon: DashboardIcon, adminOnly: false },
  { id: "players", label: "Players", icon: UsersIcon, adminOnly: false },
  { id: "accounts", label: "Accounts", icon: ShieldIcon, adminOnly: true },
  { id: "announcements", label: "Announcements", icon: MegaphoneIcon, adminOnly: false },
  { id: "account", label: "My account", icon: LockIcon, adminOnly: false },
  { id: "settings", label: "Site settings", icon: SettingsIcon, adminOnly: true },
] as const;

interface ToastItem {
  id: number;
  message: string;
  tone: "success" | "error";
}

export type DashboardMode = "staff" | "admin" | "owner";

export function Dashboard({
  user,
  mode = "staff",
  initialTab = "overview",
  tabs,
}: {
  user: SessionUser;
  mode?: DashboardMode;
  initialTab?: TabId;
  tabs?: readonly TabId[];
}) {
  const router = useRouter();
  const isAdmin = user.role === "owner" || user.role === "admin";
  const visibleTabs = TABS.filter(
    (item) => (isAdmin || !item.adminOnly) && (!tabs || tabs.includes(item.id)),
  );
  const [tab, setTab] = useState<TabId>(
    visibleTabs.some((item) => item.id === initialTab) ? initialTab : "overview",
  );
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);

  const panelLabel =
    mode === "owner" ? "Owner console" : mode === "admin" ? "Admin dashboard" : "Staff Panel";
  const active = TABS.find((item) => item.id === tab) ?? TABS[0];

  function notify(message: string, tone: "success" | "error" = "success") {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4200);
  }

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Even if the request fails, the cookie is cleared by the redirect below.
    }
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-ink-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col lg:flex-row">
        <aside className="border-b border-white/[0.06] bg-ink-900/30 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[248px] lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between px-4 py-4">
            <Link href="/" className="flex items-center gap-2.5" aria-label="DemonMC home">
              <LogoMark size={28} />
              <Wordmark className="text-sm" />
            </Link>
            <Link href="/" aria-label="View site" className="icon-btn lg:hidden">
              <ExternalIcon width={14} height={14} />
            </Link>
          </div>

          <nav
            className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-0"
            aria-label="Staff sections"
          >
            {visibleTabs.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === tab;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-colors ${
                    isActive
                      ? "bg-white/[0.06] text-white"
                      : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-200"
                  }`}
                >
                  <Icon
                    width={16}
                    height={16}
                    className={isActive ? "text-ember" : "text-zinc-600"}
                  />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto hidden px-3 pb-4 lg:block">
            <div className="rounded-xl border border-white/[0.07] bg-ink-950/60 p-3">
              <div className="flex items-center gap-2.5">
                <Avatar name={user.username} src={user.avatarUrl} size={34} />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-white">{user.username}</p>
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-ember">
                    {ROLE_LABELS[user.role]}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                <Link href="/profile" className="text-zinc-500 transition-colors hover:text-white">
                  Profile
                </Link>
                {isAdmin && mode !== "admin" && (
                  <Link href="/admin" className="text-zinc-500 transition-colors hover:text-white">
                    Admin dashboard
                  </Link>
                )}
                {user.role === "owner" && mode !== "owner" && (
                  <Link href="/owner" className="text-zinc-500 transition-colors hover:text-white">
                    Owner console
                  </Link>
                )}
              </div>
              <button
                type="button"
                onClick={logout}
                disabled={loggingOut}
                className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.08] py-2 text-[11px] text-zinc-400 transition-colors hover:border-white/15 hover:text-white disabled:opacity-50"
              >
                <LogoutIcon width={13} height={13} />
                {loggingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink-950/85 px-5 py-4 backdrop-blur-xl sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-600">
                  {panelLabel}
                </p>
                <h1 className="mt-0.5 font-display text-lg font-semibold text-white">
                  {active.label}
                </h1>
              </div>
              <div className="flex items-center gap-2.5">
                <Link href="/" className="btn-subtle hidden sm:inline-flex">
                  <ExternalIcon width={13} height={13} />
                  View site
                </Link>
                <div className="flex items-center gap-2 lg:hidden">
                  <Avatar name={user.username} src={user.avatarUrl} size={30} />
                  <button
                    type="button"
                    onClick={logout}
                    disabled={loggingOut}
                    aria-label="Sign out"
                    className="icon-btn"
                  >
                    <LogoutIcon width={14} height={14} />
                  </button>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-5 py-7 sm:px-8">
            <div className="mx-auto w-full max-w-5xl">
              {mode === "owner" && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-ember/15 bg-ember/[0.04] px-4 py-3 text-xs leading-relaxed text-zinc-400">
                  <ShieldIcon width={15} height={15} className="mt-0.5 shrink-0 text-ember" />
                  <span>
                    <strong className="font-semibold text-white">Owner console.</strong> Appoint
                    admins, manage every account except the owner account, and edit site settings.
                    The owner role cannot be granted or removed here.
                  </span>
                </div>
              )}

              {mode === "admin" && user.role === "admin" && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-ember/15 bg-ember/[0.04] px-4 py-3 text-xs leading-relaxed text-zinc-400">
                  <ShieldIcon width={15} height={15} className="mt-0.5 shrink-0 text-ember" />
                  <span>
                    <strong className="font-semibold text-white">Admin dashboard.</strong> Manage
                    moderators, staff, players, announcements and site settings. Only the owner can
                    appoint admins or change owner-level permissions.
                  </span>
                </div>
              )}

              {!isAdmin && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-300/15 bg-amber-300/[0.04] px-4 py-3 text-xs leading-relaxed text-amber-200/80">
                  <LockIcon width={15} height={15} className="mt-0.5 shrink-0 text-amber-300" />
                  <span>
                    <strong className="font-semibold text-amber-100">Read-only access.</strong>{" "}
                    Only admins and the owner can change players, accounts, announcements or site
                    settings.
                  </span>
                </div>
              )}

              {tab === "overview" && (
                <OverviewTab user={user} canEdit={isAdmin} onNavigate={setTab} />
              )}
              {tab === "players" && <PlayersTab isOwner={isAdmin} notify={notify} />}
              {tab === "accounts" && isAdmin && <AccountsTab actor={user} notify={notify} />}
              {tab === "announcements" && (
                <AnnouncementsTab isOwner={isAdmin} notify={notify} />
              )}
              {tab === "account" && <AccountTab user={user} notify={notify} />}
              {tab === "settings" && isAdmin && <SettingsTab notify={notify} />}
            </div>
          </main>
        </div>
      </div>

      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-full max-w-xs flex-col gap-2 px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto animate-fade-up rounded-lg border px-4 py-3 text-sm shadow-panel backdrop-blur ${
              toast.tone === "error"
                ? "border-ember/30 bg-ink-900/95 text-ember-bright"
                : "border-emerald-400/20 bg-ink-900/95 text-emerald-300"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
