import { NextResponse } from "next/server";
import { getSessionUser } from "./auth";
import { isStaffRole, type SessionUser } from "./types";

export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const data = await req.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    return data as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<
  { user: SessionUser; response?: undefined } | { user?: undefined; response: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) return { response: jsonError("Authentication required.", 401) };
  return { user };
}

export async function requireStaff(): Promise<
  { user: SessionUser; response?: undefined } | { user?: undefined; response: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) return { response: jsonError("Authentication required.", 401) };
  if (!isStaffRole(user.role)) {
    return { response: jsonError("Staff access is required.", 403) };
  }
  return { user };
}

export async function requireAdmin(): Promise<
  { user: SessionUser; response?: undefined } | { user?: undefined; response: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) return { response: jsonError("Authentication required.", 401) };
  if (user.role !== "owner" && user.role !== "admin") {
    return { response: jsonError("Only admins and the owner can perform this action.", 403) };
  }
  return { user };
}

export async function requireOwner(): Promise<
  { user: SessionUser; response?: undefined } | { user?: undefined; response: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) return { response: jsonError("Authentication required.", 401) };
  if (user.role !== "owner") {
    return { response: jsonError("Only the owner can perform this action.", 403) };
  }
  return { user };
}

export function mutationGuard(req: Request): NextResponse | null {
  if (!sameOrigin(req)) return jsonError("Invalid request origin.", 403);
  return null;
}
