import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/api";
import { countRows } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireStaff();
  if (auth.response) return auth.response;

  return NextResponse.json(
    { counts: await countRows(), user: auth.user },
    { headers: { "Cache-Control": "no-store" } },
  );
}
