import { DEFAULT_SETTINGS, query, withTransaction } from "./db";
import type { SiteSettings } from "./types";

const KEYS = {
  headline: "site.headline",
  subtitle: "site.subtitle",
  ip: "site.ip",
  discord: "site.discord",
} as const;

export async function getSettings(): Promise<SiteSettings> {
  const { rows } = await query<{ key: string; value: string }>(
    "SELECT key, value FROM settings",
  );
  const map = new Map(rows.map((row) => [row.key, row.value]));
  return {
    headline: map.get(KEYS.headline) ?? DEFAULT_SETTINGS[KEYS.headline],
    subtitle: map.get(KEYS.subtitle) ?? DEFAULT_SETTINGS[KEYS.subtitle],
    ip: map.get(KEYS.ip) ?? DEFAULT_SETTINGS[KEYS.ip],
    discord: map.get(KEYS.discord) ?? DEFAULT_SETTINGS[KEYS.discord],
  };
}

export async function updateSettings(patch: Partial<SiteSettings>): Promise<SiteSettings> {
  await withTransaction(async (client) => {
    for (const [field, key] of Object.entries(KEYS) as [keyof SiteSettings, string][]) {
      const value = patch[field];
      if (typeof value === "string") {
        await client.query(
          "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = excluded.value",
          [key, value],
        );
      }
    }
  });
  return getSettings();
}
