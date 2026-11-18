import { cookies } from "next/headers";
import { cache } from "react";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { query } from "./db";
import type { Role, SessionUser } from "./types";

const COOKIE_NAME = "demonmc_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const BCRYPT_ROUNDS = 12;

interface UserRow {
  id: number;
  username: string;
  email: string | null;
  password_hash: string;
  role: Role;
  description: string;
  avatar_url: string | null;
  joined_at: string;
  disabled: boolean;
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

let dummyHash: string | null = null;

export async function authenticate(identifier: string, password: string): Promise<SessionUser | null> {
  const { rows } = await query<UserRow>(
    `SELECT id, username, email, password_hash, role, description, avatar_url, joined_at, disabled
     FROM users
     WHERE lower(username) = lower($1) OR lower(email) = lower($1)
     LIMIT 1`,
    [identifier],
  );
  const row = rows[0];

  if (!row) {
    // Equalize timing so accounts cannot be enumerated.
    dummyHash ??= bcrypt.hashSync("demonmc-invalid-account", 10);
    await bcrypt.compare(password, dummyHash);
    return null;
  }

  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid || row.disabled) return null;

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    description: row.description,
    avatarUrl: row.avatar_url,
    joinedAt: row.joined_at,
  };
}

export async function createSession(userId: number): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const now = Date.now();
  const createdAt = new Date(now).toISOString();
  const expiresAt = new Date(now + SESSION_TTL_MS).toISOString();

  await query("DELETE FROM sessions WHERE expires_at < $1", [createdAt]);
  await query(
    "INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES ($1, $2, $3, $4)",
    [sha256(token), userId, createdAt, expiresAt],
  );

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export async function revokeUserSessions(userId: number): Promise<void> {
  await query("DELETE FROM sessions WHERE user_id = $1", [userId]);
}

export async function revokeOtherSessions(userId: number): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await query("DELETE FROM sessions WHERE user_id = $1 AND token_hash <> $2", [
      userId,
      sha256(token),
    ]);
  } else {
    await query("DELETE FROM sessions WHERE user_id = $1", [userId]);
  }
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await query("DELETE FROM sessions WHERE token_hash = $1", [sha256(token)]);
  }
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const { rows } = await query<UserRow & { expires_at: string }>(
    `SELECT u.id, u.username, u.email, u.role, u.description, u.avatar_url, u.joined_at,
            u.disabled, s.expires_at
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1`,
    [sha256(token)],
  );
  const row = rows[0];

  if (!row) return null;

  if (row.disabled) {
    await query("DELETE FROM sessions WHERE user_id = $1", [row.id]);
    return null;
  }

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await query("DELETE FROM sessions WHERE token_hash = $1", [sha256(token)]);
    return null;
  }

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    description: row.description,
    avatarUrl: row.avatar_url,
    joinedAt: row.joined_at,
  };
});
