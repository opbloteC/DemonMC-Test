import { NextResponse } from "next/server";
import { jsonError, mutationGuard, readJson } from "@/lib/api";
import { hashPassword } from "@/lib/auth";
import { isUniqueViolation, query } from "@/lib/db";
import {
  ipAttemptKey,
  lockRemainingMs,
  recordLoginFailure,
} from "@/lib/login-guard";
import { isEmailAddress, isStrongPassword } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REGISTRATION_LIMIT = 10;

function registrationKey(req: Request): string {
  return `register:${ipAttemptKey(req)}`;
}

export async function POST(req: Request) {
  const guard = mutationGuard(req);
  if (guard) return guard;

  const key = registrationKey(req);
  const remaining = await lockRemainingMs(key, REGISTRATION_LIMIT);
  if (remaining > 0) {
    const minutes = Math.max(1, Math.ceil(remaining / 60000));
    return NextResponse.json(
      {
        error: `Too many account creation attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(Math.ceil(remaining / 1000)),
        },
      },
    );
  }

  const body = await readJson(req);
  if (!body) return jsonError("Invalid request body.");

  await recordLoginFailure(key, REGISTRATION_LIMIT);

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";

  if (!isEmailAddress(email)) return jsonError("Enter a valid email address.", 422);
  if (!isStrongPassword(password)) {
    return jsonError("Password must be 10–200 characters and include a letter and a number.", 422);
  }
  if (password !== confirmPassword) return jsonError("Passwords do not match.", 422);

  const existing = await query<{ id: number }>(
    "SELECT id FROM users WHERE lower(username) = lower($1) OR lower(email) = lower($1) LIMIT 1",
    [email],
  );
  if (existing.rows[0]) return jsonError("An account with that email already exists.", 409);

  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();

  try {
    await query(
      `INSERT INTO users (username, email, password_hash, role, description, avatar_url, joined_at, created_at, disabled)
       VALUES ($1, $2, $3, 'player', '', NULL, $4, $5, FALSE)`,
      [email, email, passwordHash, now.slice(0, 10), now],
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      return jsonError("An account with that email already exists.", 409);
    }
    console.error("Failed to create account:", error);
    return jsonError("Could not create the account.", 500);
  }

  return NextResponse.json(
    { ok: true },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
