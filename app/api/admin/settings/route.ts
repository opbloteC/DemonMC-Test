import { NextResponse } from "next/server";
import { jsonError, mutationGuard, readJson, requireAdmin, requireStaff } from "@/lib/api";
import { getSettings, updateSettings } from "@/lib/settings";
import { isDiscordInvite, isServerAddress, text } from "@/lib/validation";
import type { SiteSettings } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireStaff();
  if (auth.response) return auth.response;

  return NextResponse.json(
    { settings: await getSettings() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const guard = mutationGuard(req);
  if (guard) return guard;

  const body = await readJson(req);
  if (!body) return jsonError("Invalid request body.");

  const patch: Partial<SiteSettings> = {};

  if ("headline" in body) {
    const headline = text(body.headline, 3, 90);
    if (!headline) return jsonError("Headline must be between 3 and 90 characters.", 422);
    patch.headline = headline;
  }

  if ("subtitle" in body) {
    const subtitle = text(body.subtitle, 3, 140);
    if (!subtitle) return jsonError("Subtitle must be between 3 and 140 characters.", 422);
    patch.subtitle = subtitle;
  }

  if ("ip" in body) {
    const ip = typeof body.ip === "string" ? body.ip.trim() : "";
    if (!isServerAddress(ip)) return jsonError("Enter a valid server address, for example play.demonmc.net.", 422);
    patch.ip = ip;
  }

  if ("discord" in body) {
    const discord = typeof body.discord === "string" ? body.discord.trim() : "";
    if (!isDiscordInvite(discord)) return jsonError("Enter a valid Discord invite link.", 422);
    patch.discord = discord;
  }

  if (Object.keys(patch).length === 0) return jsonError("No changes provided.", 422);

  return NextResponse.json({ settings: await updateSettings(patch) });
}
