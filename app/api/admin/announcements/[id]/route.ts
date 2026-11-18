import { NextResponse } from "next/server";
import { jsonError, mutationGuard, readJson, requireAdmin } from "@/lib/api";
import { query } from "@/lib/db";
import { getAnnouncement } from "@/lib/queries";
import { text } from "@/lib/validation";

export const runtime = "nodejs";

async function parseId(params: Promise<{ id: string }>): Promise<number | null> {
  const { id } = await params;
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const guard = mutationGuard(req);
  if (guard) return guard;

  const id = await parseId(params);
  if (!id) return jsonError("Invalid announcement id.", 400);
  if (!(await getAnnouncement(id))) return jsonError("Announcement not found.", 404);

  const body = await readJson(req);
  if (!body) return jsonError("Invalid request body.");

  const updates: string[] = [];
  const values: string[] = [];
  const addUpdate = (column: string, value: string) => {
    values.push(value);
    updates.push(`${column} = $${values.length}`);
  };

  if ("title" in body) {
    const title = text(body.title, 3, 120);
    if (!title) return jsonError("Title must be between 3 and 120 characters.", 422);
    addUpdate("title", title);
  }

  if ("body" in body) {
    const announcementBody = text(body.body, 3, 2000);
    if (!announcementBody) return jsonError("Announcement text must be between 3 and 2000 characters.", 422);
    addUpdate("body", announcementBody);
  }

  if (updates.length === 0) return jsonError("No changes provided.", 422);

  addUpdate("updated_at", new Date().toISOString());

  await query(
    `UPDATE announcements SET ${updates.join(", ")} WHERE id = $${values.length + 1}`,
    [...values, id],
  );

  return NextResponse.json({ announcement: await getAnnouncement(id) });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const guard = mutationGuard(req);
  if (guard) return guard;

  const id = await parseId(params);
  if (!id) return jsonError("Invalid announcement id.", 400);

  const result = await query("DELETE FROM announcements WHERE id = $1", [id]);
  if (result.rowCount === 0) return jsonError("Announcement not found.", 404);

  return NextResponse.json({ ok: true });
}
