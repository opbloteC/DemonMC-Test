import { NextResponse } from "next/server";
import { jsonError, mutationGuard, readJson, requireAdmin, requireStaff } from "@/lib/api";
import { query } from "@/lib/db";
import { getAnnouncement, listAnnouncements } from "@/lib/queries";
import { text } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireStaff();
  if (auth.response) return auth.response;

  return NextResponse.json(
    { announcements: await listAnnouncements() },
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

  const title = text(body.title, 3, 120);
  if (!title) return jsonError("Title must be between 3 and 120 characters.", 422);

  const announcementBody = text(body.body, 3, 2000);
  if (!announcementBody) return jsonError("Announcement text must be between 3 and 2000 characters.", 422);

  const now = new Date().toISOString();
  const { rows } = await query<{ id: number }>(
    `INSERT INTO announcements (title, body, created_at, updated_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [title, announcementBody, now, now],
  );

  const announcement = await getAnnouncement(rows[0].id);
  return NextResponse.json({ announcement }, { status: 201 });
}
