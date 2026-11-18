import { query } from "./db";

export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const USERNAME_FAILURE_LIMIT = 5;
export const IP_FAILURE_LIMIT = 25;

interface AttemptRow {
  count: number;
  reset_at: string;
}

export async function lockRemainingMs(key: string, limit: number): Promise<number> {
  const now = Date.now();
  const { rows } = await query<AttemptRow>(
    "SELECT count, reset_at FROM auth_attempts WHERE key = $1",
    [key],
  );
  const row = rows[0];

  if (!row) return 0;
  const resetAt = Number(row.reset_at);
  if (resetAt <= now) {
    await query("DELETE FROM auth_attempts WHERE key = $1", [key]);
    return 0;
  }
  return row.count >= limit ? resetAt - now : 0;
}

export async function recordLoginFailure(key: string, limit: number): Promise<void> {
  const now = Date.now();
  const resetAt = now + LOGIN_WINDOW_MS;

  await query(
    `INSERT INTO auth_attempts (key, count, reset_at) VALUES ($1, 1, $2)
     ON CONFLICT (key) DO UPDATE SET
       count = CASE
         WHEN auth_attempts.reset_at > $3 THEN auth_attempts.count + 1
         ELSE 1
       END,
       reset_at = CASE
         WHEN auth_attempts.reset_at > $3 AND auth_attempts.count + 1 < $4
           THEN auth_attempts.reset_at
         ELSE $2
       END`,
    [key, resetAt, now, limit],
  );
}

export async function clearLoginFailures(key: string): Promise<void> {
  await query("DELETE FROM auth_attempts WHERE key = $1", [key]);
}

export function usernameAttemptKey(username: string): string {
  return `user:${username.trim().toLowerCase()}`;
}

export function ipAttemptKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
  return `ip:${ip}`;
}
