import { NextResponse } from "next/server";
import { jsonError, mutationGuard, readJson, requireAdmin } from "@/lib/api";
import { isUniqueViolation, query } from "@/lib/db";
import { getPlayer } from "@/lib/queries";
import {
  isHttpUrl,
  isIsoDate,
  isPlayerCategory,
  normalizeMinecraftName,
  optionalText,
} from "@/lib/validation";

export const runtime = "nodejs";

async function parseId(params: Promise<{ id: string }>): Promise<number | null> {
  const { id } = await params;
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const guard = mutationGuard(req);
  if (guard) return guard;

  const id = await parseId(params);
  if (!id) return jsonError("Invalid player id.", 400);
  if (!(await getPlayer(id))) return jsonError("Player not found.", 404);

  const body = await readJson(req);
  if (!body) return jsonError("Invalid request body.");

  const updates: string[] = [];
  const values: (string | null)[] = [];
  const addUpdate = (column: string, value: string | null) => {
    values.push(value);
    updates.push(`${column} = $${values.length}`);
  };

  if ("username" in body) {
    const username = normalizeMinecraftName(body.username);
    if (!username) {
      return jsonError("Minecraft username must be 3-16 characters (letters, numbers, spaces or underscores).", 422);
    }
    addUpdate("username", username);
  }

  if ("category" in body) {
    if (!isPlayerCategory(body.category)) return jsonError("Choose a valid category.", 422);
    addUpdate("category", body.category);
  }

  if ("rankLabel" in body) {
    const rankLabel = optionalText(body.rankLabel, 40);
    if (rankLabel === null) return jsonError("Rank label is too long.", 422);
    addUpdate("rank_label", rankLabel);
  }

  if ("description" in body) {
    const description = optionalText(body.description, 300);
    if (description === null) return jsonError("Description is too long.", 422);
    addUpdate("description", description);
  }

  if ("joinedAt" in body) {
    if (!isIsoDate(body.joinedAt)) return jsonError("Joined date must be a valid date.", 422);
    addUpdate("joined_at", body.joinedAt);
  }

  if ("avatarUrl" in body) {
    if (body.avatarUrl === "" || body.avatarUrl === null) {
      addUpdate("avatar_url", null);
    } else if (isHttpUrl(body.avatarUrl)) {
      addUpdate("avatar_url", body.avatarUrl);
    } else {
      return jsonError("Avatar URL must be a valid http(s) link.", 422);
    }
  }

  if (updates.length === 0) return jsonError("No changes provided.", 422);

  try {
    await query(
      `UPDATE players SET ${updates.join(", ")} WHERE id = $${values.length + 1}`,
      [...values, id],
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      return jsonError("A player with that username already exists.", 409);
    }
    console.error("Failed to update player:", error);
    return jsonError("Could not update the player.", 500);
  }

  return NextResponse.json({ player: await getPlayer(id) });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const guard = mutationGuard(req);
  if (guard) return guard;

  const id = await parseId(params);
  if (!id) return jsonError("Invalid player id.", 400);

  const result = await query("DELETE FROM players WHERE id = $1", [id]);
  if (result.rowCount === 0) return jsonError("Player not found.", 404);

  return NextResponse.json({ ok: true });
}
