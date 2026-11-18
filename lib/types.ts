export const ROLES = ["owner", "admin", "moderator", "staff", "player"] as const;
export type Role = (typeof ROLES)[number];

export const STAFF_ROLES = ["owner", "admin", "moderator", "staff"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const PLAYER_CATEGORIES = [
  "owner",
  "admin",
  "moderator",
  "staff",
  "helper",
  "developer",
  "player",
] as const;
export type PlayerCategory = (typeof PLAYER_CATEGORIES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  moderator: "Moderator",
  staff: "Staff",
  player: "Player",
};

export const PLAYER_CATEGORY_LABELS: Record<PlayerCategory, string> = {
  owner: "Owner",
  admin: "Admin",
  moderator: "Moderator",
  staff: "Staff",
  helper: "Helper",
  developer: "Developer",
  player: "Players",
};

export function isStaffRole(role: Role): role is StaffRole {
  return role !== "player";
}

export function canManageAccounts(role: Role): boolean {
  return role === "owner" || role === "admin";
}

const ROLE_RANK: Record<Role, number> = {
  owner: 4,
  admin: 3,
  moderator: 2,
  staff: 1,
  player: 0,
};

export function canManageRole(actorRole: Role, targetRole: Role): boolean {
  if (targetRole === "owner") return false;
  if (actorRole === "owner") return true;
  return actorRole === "admin" && ROLE_RANK[targetRole] < ROLE_RANK.admin;
}

export function canAssignRole(actorRole: Role, role: Role): boolean {
  if (role === "owner") return false;
  return actorRole === "owner" || (actorRole === "admin" && ROLE_RANK[role] < ROLE_RANK.admin);
}

export interface SessionUser {
  id: number;
  username: string;
  email: string | null;
  role: Role;
  description: string;
  avatarUrl: string | null;
  joinedAt: string;
}

export interface StaffMember {
  id: number;
  username: string;
  role: Role;
  description: string;
  avatarUrl: string | null;
  joinedAt: string;
}

export interface Account {
  id: number;
  username: string;
  role: Role;
  disabled: boolean;
  description: string;
  avatarUrl: string | null;
  joinedAt: string;
  createdAt: string;
}

export interface PlayerProfile {
  id: number;
  username: string;
  category: PlayerCategory;
  rankLabel: string;
  description: string;
  avatarUrl: string | null;
  joinedAt: string;
}

export interface PublicPlayer {
  username: string;
  role: Role;
  description: string;
  joinedAt: string;
}

export interface Announcement {
  id: number;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface SiteSettings {
  headline: string;
  subtitle: string;
  ip: string;
  discord: string;
}

export interface ServerStatus {
  reachable: boolean;
  online: boolean;
  players: { online: number; max: number; names?: string[] } | null;
  version: string | null;
  checkedAt: string;
}
