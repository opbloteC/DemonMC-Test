import { PLAYER_CATEGORIES, ROLES, type PlayerCategory, type Role } from "./types";

export function text(value: unknown, min: number, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) return null;
  return trimmed;
}

export function optionalText(value: unknown, max: number): string | null {
  if (value === undefined || value === null || value === "") return "";
  return text(value, 0, max);
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function isPlayerCategory(value: unknown): value is PlayerCategory {
  return typeof value === "string" && (PLAYER_CATEGORIES as readonly string[]).includes(value);
}

export function normalizeMinecraftName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  if (!/^[A-Za-z0-9_ ]{3,16}$/.test(name)) return null;
  return name;
}

export function isLoginUsername(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_.-]{3,24}$/.test(value);
}

export function isEmailAddress(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const email = value.trim();
  if (email.length < 6 || email.length > 254) return false;

  const at = email.lastIndexOf("@");
  const local = email.slice(0, at);
  if (at <= 0 || local.length > 64) return false;
  if (email.includes("..")) return false;

  return /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/.test(
    email,
  );
}

export function isStrongPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 10 && value.length <= 200 && /[A-Za-z]/.test(value) && /\d/.test(value);
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 500) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function isDiscordInvite(value: unknown): value is string {
  if (!isHttpUrl(value)) return false;
  const host = new URL(value).hostname.toLowerCase();
  return host === "discord.gg" || host === "discord.com" || host === "discordapp.com";
}

export function isServerAddress(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 3 &&
    value.length <= 253 &&
    /^[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?(?::\d{1,5})?$/.test(value)
  );
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
