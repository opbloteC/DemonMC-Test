import { NextResponse } from "next/server";
import { authenticate, createSession } from "@/lib/auth";
import { jsonError, mutationGuard, readJson } from "@/lib/api";
import {
  clearLoginFailures,
  ipAttemptKey,
  IP_FAILURE_LIMIT,
  lockRemainingMs,
  recordLoginFailure,
  USERNAME_FAILURE_LIMIT,
  usernameAttemptKey,
} from "@/lib/login-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function lockedResponse(remainingMs: number): NextResponse {
  const minutes = Math.max(1, Math.ceil(remainingMs / 60000));
  return NextResponse.json(
    { error: `Too many failed sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` },
    {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": String(Math.ceil(remainingMs / 1000)),
      },
    },
  );
}

export async function POST(req: Request) {
  const guard = mutationGuard(req);
  if (guard) return guard;

  const body = await readJson(req);
  if (!body) return jsonError("Invalid request body.");

  const identifier = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!identifier || identifier.length > 254) {
    return jsonError("Enter a valid email or username.", 422);
  }
  if (!password || password.length > 200) return jsonError("Enter a valid password.", 422);

  const userKey = usernameAttemptKey(identifier);
  const ipKey = ipAttemptKey(req);
  const [userRemaining, ipRemaining] = await Promise.all([
    lockRemainingMs(userKey, USERNAME_FAILURE_LIMIT),
    lockRemainingMs(ipKey, IP_FAILURE_LIMIT),
  ]);
  const remaining = Math.max(userRemaining, ipRemaining);
  if (remaining > 0) return lockedResponse(remaining);

  const user = await authenticate(identifier, password);
  if (!user) {
    await Promise.all([
      recordLoginFailure(userKey, USERNAME_FAILURE_LIMIT),
      recordLoginFailure(ipKey, IP_FAILURE_LIMIT),
    ]);
    return jsonError("Invalid email/username or password.", 401);
  }

  await clearLoginFailures(userKey);
  await createSession(user.id);

  return NextResponse.json(
    { user },
    { headers: { "Cache-Control": "no-store" } },
  );
}
