"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SiteSettings } from "@/lib/types";
import {
  apiRequest,
  ErrorNote,
  errorMessage,
  Field,
  PageSectionHeader,
  Spinner,
  type Notify,
} from "./ui";

export function SettingsTab({ notify }: { notify: Notify }) {
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoadError("");
      const data = await apiRequest<{ settings: SiteSettings }>("/api/admin/settings");
      setSettings(data.settings);
    } catch (err) {
      setLoadError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function set<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setSettings((current) => (current ? { ...current, [key]: value } : current));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;

    setError("");
    setPending(true);
    try {
      const data = await apiRequest<{ settings: SiteSettings }>("/api/admin/settings", {
        method: "PATCH",
        body: settings,
      });
      setSettings(data.settings);
      notify("Site settings saved.");
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <PageSectionHeader
        title="Site settings"
        description="Control the headline, subtitle, server address and Discord invite used across the site."
      />

      {loadError && <div className="mt-5"><ErrorNote>{loadError}</ErrorNote></div>}

      {!settings ? (
        <div className="panel mt-5 px-6 py-16">
          <Spinner label="Loading settings" />
        </div>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
          <form onSubmit={submit} className="panel p-5">
            <div className="space-y-4">
              <Field
                label="Headline"
                htmlFor="settings-headline"
                hint="The large heading on the homepage. 3–90 characters."
              >
                <input
                  id="settings-headline"
                  className="input"
                  required
                  minLength={3}
                  maxLength={90}
                  value={settings.headline}
                  onChange={(event) => set("headline", event.target.value)}
                />
              </Field>

              <Field
                label="Subtitle"
                htmlFor="settings-subtitle"
                hint="Shown directly under the headline. 3–140 characters."
              >
                <input
                  id="settings-subtitle"
                  className="input"
                  required
                  minLength={3}
                  maxLength={140}
                  value={settings.subtitle}
                  onChange={(event) => set("subtitle", event.target.value)}
                />
              </Field>

              <Field
                label="Server address"
                htmlFor="settings-ip"
                hint="Must be an address players can enter in Minecraft."
              >
                <input
                  id="settings-ip"
                  className="input font-mono text-[13px]"
                  required
                  minLength={3}
                  maxLength={253}
                  spellCheck={false}
                  value={settings.ip}
                  onChange={(event) => set("ip", event.target.value)}
                  placeholder="play.example.net"
                />
              </Field>

              <Field
                label="Discord invite"
                htmlFor="settings-discord"
                hint="Must be a discord.gg or discord.com link."
              >
                <input
                  id="settings-discord"
                  className="input font-mono text-[13px]"
                  type="url"
                  required
                  maxLength={500}
                  spellCheck={false}
                  value={settings.discord}
                  onChange={(event) => set("discord", event.target.value)}
                  placeholder="https://discord.gg/…"
                />
              </Field>
            </div>

            {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}

            <div className="mt-5 flex justify-end">
              <button type="submit" disabled={pending} className="btn-primary !py-2.5 text-xs">
                {pending ? "Saving…" : "Save settings"}
              </button>
            </div>
          </form>

          <div className="panel h-fit p-5">
            <h3 className="font-display text-sm font-semibold text-white">Homepage preview</h3>
            <p className="mt-1 text-[11px] text-zinc-600">
              How the copy looks on the hero section.
            </p>
            <div className="mt-4 rounded-xl border border-white/[0.07] bg-ink-950/70 px-5 py-8 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-zinc-500">
                DemonMC
              </p>
              <p className="mt-3 font-display text-lg font-bold uppercase leading-tight tracking-tight text-white">
                {settings.headline || "Headline"}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                {settings.subtitle || "Subtitle"}
              </p>
              <p className="mt-5 font-mono text-xs text-ember">{settings.ip || "server.ip"}</p>
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-zinc-600">
              Changes apply across the site immediately after saving. The live status widget reads
              from the server address above.
            </p>
          </div>

        </div>
      )}
    </div>
  );
}
