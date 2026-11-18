import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { closePool, ensureSchema, getPool } from "../lib/db.ts";

const ENV_PATH = path.join(process.cwd(), ".env");
const LOCAL_ENV_PATH = path.join(process.cwd(), ".env.local");

interface SourceUser {
  id: number;
  username: string;
  password_hash: string;
  role: string;
  description: string;
  avatar_url: string | null;
  joined_at: string;
  created_at: string;
  disabled: number | bigint | boolean;
}

interface SourcePlayer {
  id: number;
  username: string;
  category: string;
  rank_label: string;
  description: string;
  avatar_url: string | null;
  joined_at: string;
  created_at: string;
}

interface SourceAnnouncement {
  id: number;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
}

interface SourceSession {
  token_hash: string;
  user_id: number;
  created_at: string;
  expires_at: string;
}

interface SourceSetting {
  key: string;
  value: string;
}

interface SourceAttempt {
  key: string;
  count: number;
  reset_at: number | bigint;
}

interface Snapshot {
  users: SourceUser[];
  players: SourcePlayer[];
  announcements: SourceAnnouncement[];
  sessions: SourceSession[];
  settings: SourceSetting[];
  attempts: SourceAttempt[];
}

function loadEnv(): void {
  for (const file of [LOCAL_ENV_PATH, ENV_PATH]) {
    if (fs.existsSync(file)) process.loadEnvFile(file);
  }
}

function tableExists(db: DatabaseSync, table: string): boolean {
  return Boolean(
    db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(table),
  );
}

function hasColumn(db: DatabaseSync, table: string, column: string): boolean {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as unknown as {
    name: string;
  }[];
  return columns.some((entry) => entry.name === column);
}

function readSnapshot(db: DatabaseSync, sqlitePath: string): Snapshot {
  if (!tableExists(db, "users")) {
    throw new Error(`No users table found in ${sqlitePath}.`);
  }

  const disabled = hasColumn(db, "users", "disabled") ? "disabled" : "0 AS disabled";
  const users = db
    .prepare(
      `SELECT id, username, password_hash, role, description, avatar_url, joined_at, created_at, ${disabled}
       FROM users ORDER BY id`,
    )
    .all() as unknown as SourceUser[];

  const players = tableExists(db, "players")
    ? (db
        .prepare(
          `SELECT id, username, category, rank_label, description, avatar_url, joined_at, created_at
           FROM players ORDER BY id`,
        )
        .all() as unknown as SourcePlayer[])
    : [];

  const announcements = tableExists(db, "announcements")
    ? (db
        .prepare(
          "SELECT id, title, body, created_at, updated_at FROM announcements ORDER BY id",
        )
        .all() as unknown as SourceAnnouncement[])
    : [];

  const allSessions = tableExists(db, "sessions")
    ? (db
        .prepare(
          "SELECT token_hash, user_id, created_at, expires_at FROM sessions ORDER BY created_at",
        )
        .all() as unknown as SourceSession[])
    : [];
  const userIds = new Set(users.map((user) => Number(user.id)));
  const sessions = allSessions.filter((session) => userIds.has(Number(session.user_id)));

  const settings = tableExists(db, "settings")
    ? (db.prepare("SELECT key, value FROM settings ORDER BY key").all() as unknown as SourceSetting[])
    : [];

  const attempts = tableExists(db, "auth_attempts")
    ? (db
        .prepare("SELECT key, count, reset_at FROM auth_attempts ORDER BY key")
        .all() as unknown as SourceAttempt[])
    : [];

  return { users, players, announcements, sessions, settings, attempts };
}

function fileHash(file: string): string {
  return createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function normalizeRole(role: string): string {
  if (!role) return "player";
  return role === "helper" || role === "developer" ? "staff" : role;
}

async function main(): Promise<void> {
  loadEnv();

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Point it at a fresh PostgreSQL database first.");
  }

  const sqlitePath = path.resolve(
    process.env.SQLITE_PATH ||
      process.env.DATABASE_PATH ||
      path.join(process.cwd(), "data", "demonmc.db"),
  );
  if (!fs.existsSync(sqlitePath)) {
    throw new Error(`SQLite database not found at ${sqlitePath}.`);
  }

  const hashBefore = fileHash(sqlitePath);
  const source = new DatabaseSync(sqlitePath, { readOnly: true });
  let snapshot: Snapshot;
  try {
    source.exec("BEGIN");
    snapshot = readSnapshot(source, sqlitePath);
    source.exec("COMMIT");
  } finally {
    source.close();
  }

  if (fileHash(sqlitePath) !== hashBefore) {
    throw new Error("The SQLite database changed while reading it. Stop the site and retry.");
  }

  console.log(`Source SQLite: ${sqlitePath} (opened read-only)`);
  console.log("Connecting to PostgreSQL...");
  await ensureSchema();

  const client = await getPool().connect();
  let migrated = false;
  try {
    await client.query("BEGIN");
    await client.query(
      "LOCK TABLE users, players, announcements, sessions, settings, auth_attempts IN EXCLUSIVE MODE",
    );

    const target = await client.query<{ users: number; players: number; announcements: number }>(
      `SELECT (SELECT COUNT(*)::int FROM users) AS users,
              (SELECT COUNT(*)::int FROM players) AS players,
              (SELECT COUNT(*)::int FROM announcements) AS announcements`,
    );
    const targetCounts = target.rows[0];
    if (targetCounts.users > 0 || targetCounts.players > 0 || targetCounts.announcements > 0) {
      throw new Error(
        "The target PostgreSQL database already contains site data. Migration aborted; use a fresh database.",
      );
    }

    for (const user of snapshot.users) {
      await client.query(
        `INSERT INTO users
           (id, username, password_hash, role, description, avatar_url, joined_at, created_at, disabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          Number(user.id),
          user.username,
          user.password_hash,
          normalizeRole(user.role),
          user.description ?? "",
          user.avatar_url ?? null,
          user.joined_at,
          user.created_at ?? user.joined_at,
          Boolean(Number(user.disabled ?? 0)),
        ],
      );
    }

    for (const player of snapshot.players) {
      await client.query(
        `INSERT INTO players
           (id, username, category, rank_label, description, avatar_url, joined_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          Number(player.id),
          player.username,
          player.category,
          player.rank_label ?? "",
          player.description ?? "",
          player.avatar_url ?? null,
          player.joined_at,
          player.created_at,
        ],
      );
    }

    for (const announcement of snapshot.announcements) {
      await client.query(
        `INSERT INTO announcements (id, title, body, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          Number(announcement.id),
          announcement.title,
          announcement.body,
          announcement.created_at,
          announcement.updated_at,
        ],
      );
    }

    for (const session of snapshot.sessions) {
      await client.query(
        `INSERT INTO sessions (token_hash, user_id, created_at, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [session.token_hash, Number(session.user_id), session.created_at, session.expires_at],
      );
    }

    for (const setting of snapshot.settings) {
      await client.query(
        `INSERT INTO settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
        [setting.key, setting.value],
      );
    }

    for (const attempt of snapshot.attempts) {
      await client.query(
        `INSERT INTO auth_attempts (key, count, reset_at) VALUES ($1, $2, $3)
         ON CONFLICT (key) DO UPDATE SET count = excluded.count, reset_at = excluded.reset_at`,
        [attempt.key, Number(attempt.count), String(attempt.reset_at)],
      );
    }

    await client.query(
      `SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1), COUNT(*) > 0) FROM users`,
    );
    await client.query(
      `SELECT setval(pg_get_serial_sequence('players', 'id'), COALESCE(MAX(id), 1), COUNT(*) > 0) FROM players`,
    );
    await client.query(
      `SELECT setval(pg_get_serial_sequence('announcements', 'id'), COALESCE(MAX(id), 1), COUNT(*) > 0) FROM announcements`,
    );

    const verify = await client.query<{
      users: number;
      players: number;
      announcements: number;
      sessions: number;
      attempts: number;
    }>(
      `SELECT (SELECT COUNT(*)::int FROM users) AS users,
              (SELECT COUNT(*)::int FROM players) AS players,
              (SELECT COUNT(*)::int FROM announcements) AS announcements,
              (SELECT COUNT(*)::int FROM sessions) AS sessions,
              (SELECT COUNT(*)::int FROM auth_attempts) AS attempts`,
    );
    const copied = verify.rows[0];
    if (
      copied.users !== snapshot.users.length ||
      copied.players !== snapshot.players.length ||
      copied.announcements !== snapshot.announcements.length ||
      copied.sessions !== snapshot.sessions.length ||
      copied.attempts !== snapshot.attempts.length
    ) {
      throw new Error("Row counts did not match after copying. Transaction rolled back.");
    }

    const copiedUsers = await client.query<{
      id: number;
      username: string;
      password_hash: string;
      role: string;
      disabled: boolean;
    }>("SELECT id, username, password_hash, role, disabled FROM users");
    const sourceUsers = new Map(snapshot.users.map((user) => [Number(user.id), user]));
    for (const user of copiedUsers.rows) {
      const original = sourceUsers.get(Number(user.id));
      if (
        !original ||
        user.username !== original.username ||
        user.password_hash !== original.password_hash ||
        user.role !== normalizeRole(original.role) ||
        user.disabled !== Boolean(Number(original.disabled ?? 0))
      ) {
        throw new Error(`Verification failed for user id ${user.id}. Transaction rolled back.`);
      }
    }

    for (const setting of snapshot.settings) {
      const found = await client.query<{ value: string }>(
        "SELECT value FROM settings WHERE key = $1",
        [setting.key],
      );
      if (found.rows[0]?.value !== setting.value) {
        throw new Error(`Verification failed for setting ${setting.key}. Transaction rolled back.`);
      }
    }

    const owner = copiedUsers.rows.find((user) => user.role === "owner");
    const sourceHadOwner = snapshot.users.some((user) => normalizeRole(user.role) === "owner");
    if (sourceHadOwner && !owner) {
      throw new Error("The owner account was not copied. Transaction rolled back.");
    }

    await client.query("COMMIT");
    migrated = true;

    console.log("");
    console.log("Migration complete. The SQLite source was not modified.");
    console.log(`  Accounts:       ${snapshot.users.length}`);
    console.log(`  Owner:          ${owner?.username ?? "none found"}`);
    console.log(`  Players:        ${snapshot.players.length}`);
    console.log(`  Announcements:  ${snapshot.announcements.length}`);
    console.log(`  Sessions:       ${snapshot.sessions.length}`);
    console.log(`  Settings:       ${snapshot.settings.length}`);
    console.log(`  Login attempts: ${snapshot.attempts.length}`);
    console.log("");
    console.log("Next: set DATABASE_URL on Vercel, deploy, and sign in with the existing owner password.");
  } catch (error) {
    if (!migrated) {
      await client.query("ROLLBACK").catch(() => undefined);
    }
    throw error;
  } finally {
    client.release();
  }
}

main()
  .then(async () => {
    await closePool();
  })
  .catch(async (error: unknown) => {
    console.error("Migration failed:", error instanceof Error ? error.message : error);
    await closePool();
    process.exitCode = 1;
  });
