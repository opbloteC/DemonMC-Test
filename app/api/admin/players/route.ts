import { NextResponse } from "next/server";
import { jsonError, mutationGuard, readJson, requireAdmin, requireStaff } from "@/lib/api";
import { isUniqueViolation, query } from "@/lib/db";
import { getPlayer, listPlayers } from "@/lib/queries";
import {
  isHttpUrl,
  isIsoDate,
  isPlayerCategory,
  normalizeMinecraftName,
  optionalText,
  todayIsoDate,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireStaff();
  if (auth.response) return auth.response;

  return NextResponse.json(
    { players: await listPlayers() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const guard = mutationGuard(req);
  if (guard) return guard;

  const body = await readJson(req);
  if (!body) return jsonError("Invalid request body.");

  const username = normalizeMinecraftName(body.username);
  if (!username) {
    return jsonError("Minecraft username must be 3-16 characters (letters, numbers, spaces or underscores).", 422);
  }

  if (!isPlayerCategory(body.category)) return jsonError("Choose a valid category.", 422);

  const rankLabel = optionalText(body.rankLabel ?? "", 40);
  if (rankLabel === null) return jsonError("Rank label is too long.", 422);

  const description = optionalText(body.description ?? "", 300);
  if (description === null) return jsonError("Description is too long.", 422);

  const joinedAt = body.joinedAt === undefined || body.joinedAt === "" ? todayIsoDate() : body.joinedAt;
  if (!isIsoDate(joinedAt)) return jsonError("Joined date must be a valid date.", 422);

  let avatarUrl: string | null = null;
  if (body.avatarUrl !== undefined && body.avatarUrl !== null && body.avatarUrl !== "") {
    if (!isHttpUrl(body.avatarUrl)) return jsonError("Avatar URL must be a valid http(s) link.", 422);
    avatarUrl = body.avatarUrl;
  }

  const now = new Date().toISOString();

  try {
    const { rows } = await query<{ id: number }>(
      `INSERT INTO players (username, category, rank_label, description, avatar_url, joined_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [username, body.category, rankLabel, description, avatarUrl, joinedAt, now],
    );

    const player = await getPlayer(rows[0].id);
    return NextResponse.json({ player }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return jsonError("A player with that username already exists.", 409);
    }
    console.error("Failed to create player:", error);
    return jsonError("Could not save the player.", 500);
  }
}
