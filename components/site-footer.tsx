import Link from "next/link";
import { LogoMark, Wordmark } from "@/components/logo";
import { DiscordIcon } from "@/components/icons";
import { isStaffRole, type SessionUser, type SiteSettings } from "@/lib/types";

export function SiteFooter({
  settings,
  user,
}: {
  settings: SiteSettings;
  user: SessionUser | null;
}) {
  const staff = user ? isStaffRole(user.role) : false;

  return (
    <footer className="border-t border-white/[0.06] bg-ink-950">
      <div className="container-x py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-3" aria-label="DemonMC home">
              <LogoMark size={34} />
              <Wordmark className="text-[17px]" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500">
              A Minecraft network built for players who want more. Enter the world. Build your
              legacy.
            </p>
            <a
              href={settings.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
            >
              <DiscordIcon width={16} height={16} />
              Join our Discord
            </a>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Navigate
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link className="link-muted" href="/">Home</Link></li>
              <li><Link className="link-muted" href="/players">Players</Link></li>
              <li><Link className="link-muted" href="/announcements">Announcements</Link></li>
              {user ? (
                <>
                  <li><Link className="link-muted" href="/dashboard">Dashboard</Link></li>
                  <li><Link className="link-muted" href="/profile">Profile</Link></li>
                </>
              ) : (
                <>
                  <li><Link className="link-muted" href="/login">Login</Link></li>
                  <li><Link className="link-muted" href="/register">Register</Link></li>
                </>
              )}
              {staff && (
                <li><Link className="link-muted" href="/staff">Staff Panel</Link></li>
              )}
              {user && (user.role === "owner" || user.role === "admin") && (
                <li><Link className="link-muted" href="/admin">Admin dashboard</Link></li>
              )}
              {user?.role === "owner" && (
                <li><Link className="link-muted" href="/owner">Owner console</Link></li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Connect
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <span className="text-xs text-zinc-500">Server IP</span>
                <div className="mt-1 font-mono text-[13px] text-zinc-200">{settings.ip}</div>
              </li>
              <li>
                <a
                  className="link-muted inline-flex items-center gap-1.5"
                  href={settings.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <DiscordIcon width={14} height={14} />
                  Discord
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="divider my-10" />

        <div className="flex flex-col gap-3 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} DemonMC. All rights reserved.</p>
          <p>
            Owned &amp; operated by <span className="text-zinc-300">opblote</span> · Not affiliated
            with Mojang or Microsoft.
          </p>
        </div>
      </div>
    </footer>
  );
}
