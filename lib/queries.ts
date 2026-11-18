import { query } from "./db";
import type {
  Account,
  Announcement,
  PlayerCategory,
  PlayerProfile,
  PublicPlayer,
  Role,
  StaffMember,
} from "./types";

interface StaffRow {
  id: number;
  username: string;
  role: Role;
  description: string;
  avatar_url: string | null;
  joined_at: string;
}

interface AccountRow extends StaffRow {
  disabled: boolean;
  created_at: string;
}

interface PlayerRow {
  id: number;
  username: string;
  category: PlayerCategory;
  rank_label: string;
  description: string;
  avatar_url: string | null;
  joined_at: string;
}

interface PublicPlayerRow {
  username: string;
  role: Role;
  description: string;
  joined_at: string;
}

interface AnnouncementRow {
  id: number;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export function mapStaff(row: StaffRow): StaffMember {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    description: row.description,
    avatarUrl: row.avatar_url,
    joinedAt: row.joined_at,
  };
}

export function mapAccount(row: AccountRow): Account {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    disabled: Boolean(row.disabled),
    description: row.description,
    avatarUrl: row.avatar_url,
    joinedAt: row.joined_at,
    createdAt: row.created_at,
  };
}

export function mapPlayer(row: PlayerRow): PlayerProfile {
  return {
    id: row.id,
    username: row.username,
    category: row.category,
    rankLabel: row.rank_label,
    description: row.description,
    avatarUrl: row.avatar_url,
    joinedAt: row.joined_at,
  };
}

export function mapAnnouncement(row: AnnouncementRow): Announcement {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPublicPlayer(row: PublicPlayerRow): PublicPlayer {
  return {
    username: row.username,
    role: row.role,
    description: row.description,
    joinedAt: row.joined_at,
  };
}

export async function listStaff(): Promise<StaffMember[]> {
  const { rows } = await query<StaffRow>(
    `SELECT id, username, role, description, avatar_url, joined_at
     FROM users
     WHERE role != 'player' AND disabled = FALSE
     ORDER BY lower(username)`,
  );
  return rows.map(mapStaff);
}

export async function listAccounts(): Promise<Account[]> {
  const { rows } = await query<AccountRow>(
    `SELECT id, username, role, disabled, description, avatar_url, joined_at, created_at
     FROM users
     ORDER BY CASE role
       WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 WHEN 'moderator' THEN 2
       WHEN 'staff' THEN 3 ELSE 4 END,
       lower(username)`,
  );
  return rows.map(mapAccount);
}

export async function getAccount(id: number): Promise<Account | null> {
  const { rows } = await query<AccountRow>(
    `SELECT id, username, role, disabled, description, avatar_url, joined_at, created_at
     FROM users WHERE id = $1`,
    [id],
  );
  const row = rows[0];
  return row ? mapAccount(row) : null;
}

export async function listPlayers(): Promise<PlayerProfile[]> {
  const { rows } = await query<PlayerRow>(
    `SELECT id, username, category, rank_label, description, avatar_url, joined_at
     FROM players ORDER BY lower(username)`,
  );
  return rows.map(mapPlayer);
}

export async function listPublicPlayers(): Promise<PublicPlayer[]> {
  const { rows } = await query<PublicPlayerRow>(
    `SELECT username, role, description, joined_at
     FROM users
     WHERE disabled = FALSE
     ORDER BY CASE role
       WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 WHEN 'moderator' THEN 2
       WHEN 'staff' THEN 3 ELSE 4 END,
       lower(username)`,
  );
  return rows.map(mapPublicPlayer);
}

export async function getPublicPlayer(username: string): Promise<PublicPlayer | null> {
  const { rows } = await query<PublicPlayerRow>(
    `SELECT username, role, description, joined_at
     FROM users
     WHERE lower(username) = lower($1) AND disabled = FALSE`,
    [username],
  );
  return rows[0] ? mapPublicPlayer(rows[0]) : null;
}

export async function listAnnouncements(limit?: number): Promise<Announcement[]> {
  const sql =
    "SELECT id, title, body, created_at, updated_at FROM announcements ORDER BY created_at DESC, id DESC" +
    (limit ? " LIMIT $1" : "");
  const result = limit
    ? await query<AnnouncementRow>(sql, [limit])
    : await query<AnnouncementRow>(sql);
  return result.rows.map(mapAnnouncement);
}

export async function getAnnouncement(id: number): Promise<Announcement | null> {
  const { rows } = await query<AnnouncementRow>(
    "SELECT id, title, body, created_at, updated_at FROM announcements WHERE id = $1",
    [id],
  );
  const row = rows[0];
  return row ? mapAnnouncement(row) : null;
}

export async function getPlayer(id: number): Promise<PlayerProfile | null> {
  const { rows } = await query<PlayerRow>(
    `SELECT id, username, category, rank_label, description, avatar_url, joined_at
     FROM players WHERE id = $1`,
    [id],
  );
  const row = rows[0];
  return row ? mapPlayer(row) : null;
}

export async function countRows(): Promise<{
  players: number;
  accounts: number;
  announcements: number;
}> {
  const [players, accounts, announcements] = await Promise.all([
    query<{ count: number }>("SELECT COUNT(*)::int AS count FROM players"),
    query<{ count: number }>("SELECT COUNT(*)::int AS count FROM users"),
    query<{ count: number }>("SELECT COUNT(*)::int AS count FROM announcements"),
  ]);
  return {
    players: players.rows[0].count,
    accounts: accounts.rows[0].count,
    announcements: announcements.rows[0].count,
  };
}
