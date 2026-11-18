import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { mutationGuard } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const guard = mutationGuard(req);
  if (guard) return guard;

  await destroySession();
  return NextResponse.json({ ok: true });
}
