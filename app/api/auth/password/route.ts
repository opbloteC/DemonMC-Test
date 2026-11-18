import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { hashPassword, revokeOtherSessions } from "@/lib/auth";
import { jsonError, mutationGuard, readJson, requireUser } from "@/lib/api";
import { isStrongPassword } from "@/lib/validation";
import { clearLoginFailures, lockRemainingMs, recordLoginFailure } from "@/lib/login-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const guard = mutationGuard(req);
  if (guard) return guard;

  const auth = await requireUser();
  if (auth.response) return auth.response;

  const body = await readJson(req);
  if (!body) return jsonError("Invalid request body.", 400);

  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = body.newPassword;

  if (!currentPassword) return jsonError("Enter your current password.", 422);
  if (!isStrongPassword(newPassword)) {
    return jsonError("New password must be 10–200 characters and include a letter and a number.", 422);
  }
  if (newPassword === currentPassword) {
    return jsonError("The new password must be different from your current password.", 422);
  }

  const key = `password:${auth.user.id}`;
  const remaining = await lockRemainingMs(key, 5);
  if (remaining > 0) {
    return jsonError("Too many attempts. Try again in a few minutes.", 429);
  }
  await recordLoginFailure(key, 5);

  const { rows } = await query<{ password_hash: string }>(
    "SELECT password_hash FROM users WHERE id = $1",
    [auth.user.id],
  );
  const row = rows[0];
  if (!row) return jsonError("Account not found.", 404);

  const valid = await bcrypt.compare(currentPassword, row.password_hash);
  if (!valid) return jsonError("Current password is incorrect.", 403);

  const hash = await hashPassword(newPassword);
  await query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, auth.user.id]);
  await revokeOtherSessions(auth.user.id);
  await clearLoginFailures(key);

  return NextResponse.json({ ok: true });
}
