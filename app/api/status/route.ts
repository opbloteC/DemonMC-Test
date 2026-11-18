import { NextResponse } from "next/server";
import { getServerStatus } from "@/lib/minecraft";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { ip } = await getSettings();
  const status = await getServerStatus(ip);
  return NextResponse.json(status, {
    headers: { "Cache-Control": "public, max-age=15" },
  });
}
