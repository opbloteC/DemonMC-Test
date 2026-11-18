import { NextResponse } from "next/server";
import { jsonError, mutationGuard, readJson, requireAdmin } from "@/lib/api";
import { hashPassword } from "@/lib/auth";
import { isUniqueViolation, query } from "@/lib/db";
import { getAccount, listAccounts } from "@/lib/queries";
import { canAssignRole } from "@/lib/types";
import {
  isHttpUrl,
  isIsoDate,
  isLoginUsername,
  isRole,
  isStrongPassword,
  optionalText,
  todayIsoDate,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  return NextResponse.json(
    { accounts: await listAccounts() },
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

  const username = typeof body.username === "string" ? body.username.trim() : "";
  if (!isLoginUsername(username)) {
    return jsonError("Username must be 3–24 characters (letters, numbers, dot, dash or underscore).", 422);
  }

  if (!isStrongPassword(body.password)) {
    return jsonError("Password must be 10–200 characters and include a letter and a number.", 422);
  }

  if (!isRole(body.role) || !canAssignRole(auth.user.role, body.role)) {
    return jsonError("You cannot assign that role.", 403);
  }

  const description = optionalText(body.description ?? "", 300);
  if (description === null) return jsonError("Description is too long.", 422);

  const joinedAt = body.joinedAt === undefined || body.joinedAt === "" ? todayIsoDate() : body.joinedAt;
  if (!isIsoDate(joinedAt)) return jsonError("Joined date must be a valid date.", 422);

  let avatarUrl: string | null = null;
  if (body.avatarUrl !== undefined && body.avatarUrl !== null && body.avatarUrl !== "") {
    if (!isHttpUrl(body.avatarUrl)) return jsonError("Avatar URL must be a valid http(s) link.", 422);
    avatarUrl = body.avatarUrl;
  }

  const passwordHash = await hashPassword(body.password);
  const now = new Date().toISOString();

  try {
    const { rows } = await query<{ id: number }>(
      `INSERT INTO users (username, password_hash, role, description, avatar_url, joined_at, created_at, disabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
       RETURNING id`,
      [username, passwordHash, body.role, description, avatarUrl, joinedAt, now],
    );

    const account = await getAccount(rows[0].id);
    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return jsonError("An account with that username already exists.", 409);
    }
    console.error("Failed to create account:", error);
    return jsonError("Could not create the account.", 500);
  }
}
