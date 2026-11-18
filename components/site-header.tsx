"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/avatar";
import { LogoMark, Wordmark } from "@/components/logo";
import { SignOutButton } from "@/components/sign-out";
import { CloseIcon, DiscordIcon, MenuIcon } from "@/components/icons";
import { ROLE_LABELS, isStaffRole, type SessionUser, type SiteSettings } from "@/lib/types";

export function SiteHeader({
  settings,
  user,
}: {
  settings: SiteSettings;
  user: SessionUser | null;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const staff = user ? isStaffRole(user.role) : false;
  const nav = [
    { href: "/", label: "Home" },
    { href: "/players", label: "Players" },
    ...(user
      ? [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/profile", label: "Profile" },
        ]
      : []),
    ...(staff ? [{ href: "/staff", label: "Staff Panel" }] : []),
    { href: "/announcements", label: "Announcements" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
          scrolled || open
            ? "border-white/[0.07] bg-ink-950/85 backdrop-blur-xl"
            : "border-transparent bg-ink-950/40 backdrop-blur-sm"
        }`}
      >
        <div className="container-x flex h-[72px] items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-3" aria-label="DemonMC home">
            <LogoMark size={34} className="transition-transform duration-300 group-hover:scale-105" />
            <Wordmark className="text-[17px]" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {nav.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative rounded-md px-3.5 py-2 text-[13px] font-medium transition-colors ${
                    active ? "text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-3.5 -bottom-[1px] h-px bg-gradient-to-r from-ember/0 via-ember to-ember/0" />
                  )}
                </Link>
              );
            })}
            <a
              href={settings.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="relative rounded-md px-3.5 py-2 text-[13px] font-medium text-zinc-400 transition-colors hover:text-white"
            >
              Discord
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            {user ? (
              <>
                <a
                  href={settings.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary hidden !px-4 !py-2.5 text-xs sm:inline-flex"
                >
                  <DiscordIcon width={15} height={15} />
                  Join Discord
                </a>

                <div className="hidden items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.02] py-1 pl-1 pr-3 xl:flex">
                  <Avatar name={user.username} src={user.avatarUrl} size={26} />
                  <div className="min-w-0">
                    <p className="max-w-[104px] truncate text-[11px] font-semibold leading-tight text-white">
                      {user.username}
                    </p>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] leading-tight text-ember">
                      {ROLE_LABELS[user.role]}
                    </p>
                  </div>
                </div>

                <SignOutButton iconOnly className="icon-btn hidden sm:inline-flex" />
              </>
            ) : (
              <>
                <Link href="/login" className="btn-ghost hidden !px-4 !py-2.5 text-xs sm:inline-flex">
                  Login
                </Link>
                <Link href="/register" className="btn-primary !px-3.5 !py-2.5 text-xs sm:!px-4">
                  Register
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-200 transition hover:bg-white/[0.07] lg:hidden"
            >
              {open ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 bg-ink-950/95 backdrop-blur-xl lg:hidden">
          <div className="container-x flex h-full flex-col pt-[88px]">
            {user && (
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                <Avatar name={user.username} src={user.avatarUrl} size={38} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{user.username}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ember">
                    {ROLE_LABELS[user.role]}
                  </p>
                </div>
              </div>
            )}

            <nav className="mt-4 flex flex-col divide-y divide-white/[0.05]" aria-label="Mobile navigation">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between py-5 font-display text-2xl font-semibold uppercase tracking-wide transition-colors ${
                    isActive(item.href) ? "text-white" : "text-zinc-400"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                  <span className={`h-1.5 w-1.5 rounded-full ${isActive(item.href) ? "bg-ember" : "bg-transparent"}`} />
                </Link>
              ))}
              <a
                href={settings.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-5 font-display text-2xl font-semibold uppercase tracking-wide text-zinc-400"
                onClick={() => setOpen(false)}
              >
                Discord
                <DiscordIcon width={20} height={20} />
              </a>
            </nav>

            <div className="mt-8 flex flex-col gap-3">
              {user ? (
                <>
                  <a
                    href={settings.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full"
                  >
                    <DiscordIcon width={16} height={16} />
                    Join the Discord
                  </a>
                  <SignOutButton className="btn-ghost w-full" />
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-ghost w-full" onClick={() => setOpen(false)}>
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="btn-primary w-full"
                    onClick={() => setOpen(false)}
                  >
                    Create account
                  </Link>
                  <a
                    href={settings.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-subtle w-full"
                  >
                    <DiscordIcon width={15} height={15} />
                    Join the Discord
                  </a>
                </>
              )}
            </div>

            <p className="mt-auto pb-10 pt-8 text-center font-mono text-xs text-zinc-600">
              {settings.ip}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
