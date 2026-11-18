import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { closePool, ensureSchema, query } from "../lib/db.ts";

const ENV_PATH = path.join(process.cwd(), ".env");
const LOCAL_ENV_PATH = path.join(process.cwd(), ".env.local");

const ENV_TEMPLATE = `# PostgreSQL connection string (Neon, Supabase, Vercel Postgres, etc.)
# Example: postgresql://user:password@host/database?sslmode=require
DATABASE_URL=

# Minecraft status lookups (java or bedrock)
MC_EDITION=java
# MC_STATUS_HOST=demonmc.mcpe.network

# Owner account created by \`npm run setup\`
OWNER_USERNAME=opblote
# Optional for the first setup run. A strong password is generated if left blank.
OWNER_PASSWORD=
`;

function loadEnv(): void {
  for (const file of [LOCAL_ENV_PATH, ENV_PATH]) {
    if (fs.existsSync(file)) process.loadEnvFile(file);
  }
}

function saveEnvValue(key: string, value: string): void {
  let content: string;
  if (fs.existsSync(ENV_PATH)) {
    content = fs.readFileSync(ENV_PATH, "utf8");
  } else {
    content = ENV_TEMPLATE;
  }

  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  if (pattern.test(content)) {
    content = content.replace(pattern, line);
  } else {
    content = `${content.trimEnd()}\n${line}\n`;
  }
  fs.writeFileSync(ENV_PATH, content, "utf8");
}

function generatePassword(): string {
  for (;;) {
    const candidate = randomBytes(12).toString("base64url");
    if (/[A-Za-z]/.test(candidate) && /\d/.test(candidate)) return candidate;
  }
}

async function main(): Promise<void> {
  if (!fs.existsSync(ENV_PATH)) {
    fs.writeFileSync(ENV_PATH, ENV_TEMPLATE, "utf8");
    console.log("Created .env from the default template.");
  }

  loadEnv();

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required. Add your PostgreSQL connection string to .env.local (or .env) and run setup again.",
    );
  }

  console.log("Connecting to PostgreSQL...");
  await ensureSchema();

  const { rows } = await query<{ id: number; username: string }>(
    "SELECT id, username FROM users WHERE role = 'owner' LIMIT 1",
  );
  const existingOwner = rows[0];

  if (existingOwner) {
    console.log(`Owner account already exists: ${existingOwner.username}`);
    console.log("Password was left unchanged. Change it in Staff Panel → My account.");
    console.log("Database ready.");
    return;
  }

  const ownerUsername = (process.env.OWNER_USERNAME || "opblote").trim();
  if (!/^[A-Za-z0-9_.-]{3,24}$/.test(ownerUsername)) {
    throw new Error("OWNER_USERNAME must be 3-24 characters (letters, numbers, dot, dash, underscore).");
  }

  let ownerPassword = process.env.OWNER_PASSWORD?.trim() || "";
  let generated = false;

  if (!ownerPassword) {
    ownerPassword = generatePassword();
    generated = true;
    saveEnvValue("OWNER_PASSWORD", ownerPassword);
    console.log("Generated a strong owner password and saved it to .env.");
  } else if (ownerPassword.length < 10 || !/[A-Za-z]/.test(ownerPassword) || !/\d/.test(ownerPassword)) {
    throw new Error("OWNER_PASSWORD must be at least 10 characters and include a letter and a number.");
  }

  const passwordHash = await bcrypt.hash(ownerPassword, 12);
  const now = new Date().toISOString();

  await query(
    `INSERT INTO users (username, password_hash, role, description, avatar_url, joined_at, created_at, disabled)
     VALUES ($1, $2, 'owner', $3, NULL, $4, $5, FALSE)`,
    [
      ownerUsername,
      passwordHash,
      "Founder and owner of the DemonMC network.",
      now.slice(0, 10),
      now,
    ],
  );

  console.log("");
  console.log("Owner account created.");
  console.log(`  Username: ${ownerUsername}`);
  if (generated) {
    console.log("  Password: saved to .env (OWNER_PASSWORD). It is not printed here.");
  }
  console.log("");
  console.log("Next steps:");
  console.log("  npm run migrate:sqlite   # copy existing SQLite data (if you have an existing site)");
  console.log("  npm run dev              # start the site at http://localhost:3000");
}

main()
  .then(async () => {
    await closePool();
  })
  .catch(async (error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    await closePool();
    process.exitCode = 1;
  });
