# DemonMC Network Website

Official site for the **DemonMC** Minecraft network — homepage with a live server status widget, a player directory, announcements, a personal dashboard and a role-aware staff panel. The homepage, sign-in and registration pages are public; the player directory, announcements, dashboard and staff panel require a signed-in account. Players register with an email address and password.

**Owner:** opblote · **Server:** `demonmc.mcpe.network` · **Discord:** <https://discord.gg/mFYwCJBTuA>

Built with Next.js 15 (App Router), React 19, Tailwind CSS and **PostgreSQL** through `pg` (node-postgres). Designed to deploy on Vercel; no local filesystem persistence is required.

---

## Requirements

- **Node.js 24** (recommended). The setup and migration scripts run TypeScript directly with Node's native support.
- npm (bundled with Node.js).
- A **PostgreSQL** database (Neon, Supabase, Vercel Postgres, RDS or self-hosted).
- Internet access on the server, so the Minecraft status API can be reached.

---

## Quick start (new installation)

```bash
npm install
```

1. Create a PostgreSQL database and copy its **pooled** connection string.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` (keep `?sslmode=require` when your provider requires TLS).
3. Run:

```bash
npm run setup      # create schema and the single owner account
npm run dev        # http://localhost:3000
```

`npm run setup` will:

1. connect to PostgreSQL and create the schema if needed,
2. create the **only** administrator account — username `opblote` by default (role `owner`),
3. use `OWNER_PASSWORD` if provided, otherwise generate a strong random password, save it to `.env` and **not print it**,
4. leave an existing owner untouched.

Sign in at **<http://localhost:3000/login>**. New players can register at **<http://localhost:3000/register>**.

If you are upgrading an existing DemonMC site, **do not run setup first** — follow [Migrating existing SQLite data](#migrating-existing-sqlite-data) instead.

---

## Deploying to Vercel

### 1. Provision PostgreSQL

Use a managed provider and copy the **pooled** connection string. Examples: Neon (pooled host), Supabase (connection pooler), Vercel Postgres, AWS RDS Proxy. Include SSL, usually `?sslmode=require`.

The app creates its tables automatically on first use. For an existing site, migrate the SQLite data **before** users sign in (see below).

### 2. Migrate or seed

For an **existing site**, run the migration locally against the new database:

```bash
# Stop the local site first. Keep data/demonmc.db.
DATABASE_URL='postgresql://...' npm run migrate:sqlite
```

For a **new site**, seed the owner instead:

```bash
DATABASE_URL='postgresql://...' npm run setup
```

Do not use both `setup` and `migrate:sqlite` against the same empty database when migrating existing data — the migration must run first because it refuses to overwrite existing users.

### 3. Add environment variables in Vercel

In **Project → Settings → Environment Variables** add:

| Variable | Required on Vercel | Value |
| --- | :---: | --- |
| `DATABASE_URL` | **Yes** | PostgreSQL pooled connection string, e.g. `postgresql://user:password@host/db?sslmode=require` |
| `MC_EDITION` | No | `java` (default) or `bedrock` |
| `MC_STATUS_HOST` | No | Optional status-API host override |

That is the complete runtime list. Specifically:

- **Only `DATABASE_URL` is required.** It must be available to Production, Preview and Development environments if you use all three.
- `OWNER_USERNAME` and `OWNER_PASSWORD` are **setup-only**; the deployed app never reads them. Do not add them to Vercel.
- `SQLITE_PATH` / legacy `DATABASE_PATH` are **migration-only** and must not be set on Vercel.
- No separate session secret is needed: sessions use random tokens stored (hashed) in PostgreSQL.
- `NODE_ENV=production` is set automatically by Vercel, which also enables `Secure` session cookies.

Never prefix `DATABASE_URL` with `NEXT_PUBLIC_`; it must stay server-side. Do not commit `.env`.

### 4. Deploy

Import the repository into Vercel and use the defaults:

- Install command: `npm install`
- Build command: `npm run build`
- Output: Next.js default

Database-backed pages are dynamic, so the production build does not need a live database; the first request after deployment connects and ensures the schema.

### 5. Verify

1. Open `/login` and sign in with the existing owner account (`opblote`) and the same password used before the migration.
2. Open `/staff`, confirm counts and account list.
3. Register a test player and confirm it receives the `player` role.
4. Delete the test account from **Staff Panel → Accounts**.

For serverless connection limits, keep the pooled URL and the built-in pool (`max: 5` per instance). A provider pooler is strongly recommended.

---

## Environment variables

| Variable | Required | Runtime? | Purpose |
| --- | :---: | :---: | --- |
| `DATABASE_URL` | Yes | Yes | PostgreSQL connection string. Use a pooled URL and SSL. |
| `MC_EDITION` | No | Yes | Minecraft edition for status checks (`java` or `bedrock`, default `java`). |
| `MC_STATUS_HOST` | No | Yes | Optional status-API host override. |
| `OWNER_USERNAME` | No | Setup only | Owner username created by `npm run setup` (default `opblote`). |
| `OWNER_PASSWORD` | No | Setup only | Initial owner password. Generated and saved to `.env` when blank. |
| `SQLITE_PATH` | No | Migration only | Legacy SQLite file for `npm run migrate:sqlite` (default `./data/demonmc.db`). |
| `DATABASE_PATH` | No | Migration only | Legacy alias accepted by the migration script. |

The server IP, headline, subtitle and Discord invite live in the database and are edited in **Staff Panel → Settings**.

### TLS and connection strings

- Remote hosts enable TLS with certificate verification in `lib/db.ts`; `localhost` does not.
- Use the `sslmode` your provider recommends — `?sslmode=require` or, preferably, `?sslmode=verify-full`.
- If your provider uses a certificate your Node.js trust store does not recognize, use `?sslmode=no-verify` only after confirming the host is correct.
- For a local PostgreSQL without TLS, use `?sslmode=disable`.

---

## Migrating existing SQLite data

The migration is **read-only on the SQLite side** and **transactional on PostgreSQL**. It never deletes or edits `data/demonmc.db`.

### Before you start

1. Stop the local DemonMC site so the database is not being written.
2. Back up the database file and, if present, its WAL companions:

   ```bash
   cp data/demonmc.db data/demonmc.db.bak
   # if these exist:
   cp data/demonmc.db-wal data/demonmc.db-wal.bak
   cp data/demonmc.db-shm data/demonmc.db-shm.bak
   ```

3. Use a **fresh, empty PostgreSQL database**. The script aborts if the target already contains users, players or announcements. The default settings rows created by the schema are allowed.

### Run the migration

```bash
# Either put DATABASE_URL in .env, or pass it inline:
DATABASE_URL='postgresql://...' npm run migrate:sqlite
```

If the SQLite file is somewhere else:

```bash
DATABASE_URL='postgresql://...' \
SQLITE_PATH='./path/to/demonmc.db' \
npm run migrate:sqlite
```

### What it does

- Opens SQLite in **read-only** mode and verifies the file hash is unchanged afterwards.
- Copies, preserving IDs:
  - every account — username, **bcrypt password hash**, role, description, avatar, join date, disabled flag;
  - the owner account and all permissions;
  - players, announcements, settings, sessions and login-attempt records.
- Preserves case-insensitive uniqueness through a `lower(username)` unique index.
- Converts legacy `helper` / `developer` roles to `staff`.
- Copies data inside **one PostgreSQL transaction**, then:
  - verifies row counts;
  - compares every account's bcrypt hash, role and disabled flag byte-for-byte;
  - verifies the owner exists;
  - verifies each setting value;
  - resets identity sequences so new rows get unused IDs.
- Rolls back on any verification failure and prints the error.
- Never prints password hashes, passwords or session tokens.

If the target is not empty, the script exits non-zero **without changing it**. Use a fresh database or restore it to empty, then retry.

After a successful migration:

```bash
DATABASE_URL='postgresql://...' npm run dev
```

Sign in with the **existing owner password**, verify the site, then add the same `DATABASE_URL` to Vercel. Keep the SQLite file and backup until you have verified production; the app no longer reads it at runtime.

---

## Database schema

The schema is defined once in `lib/db.ts` and is applied idempotently on first connection:

- `users` — identity `id`, case-insensitive unique `username`, optional case-insensitive unique `email`, `password_hash`, `role`, profile fields, `disabled BOOLEAN`. On startup the schema adds the `email` column to older databases without touching existing rows, then backfills it only for usernames that are already valid email addresses.
- `players` — case-insensitive unique Minecraft names, category, rank label, profile fields.
- `announcements` — title, body, created/updated timestamps.
- `sessions` — SHA-256 token hash (primary key), user foreign key with cascade delete, expiry.
- `settings` — key/value site settings.
- `auth_attempts` — login, registration and password-change lockout counters.

Indexes cover case-insensitive account/player names, announcement ordering, session ownership and expiry. Timestamps remain ISO text so existing values and the API stay compatible. Deleting a user cascades to its sessions.

All application queries are parameterized (`$1`, `$2`, …); no request data is interpolated into SQL.

---

## Using the site

The homepage is public. Every other page and API requires a valid session:

- protected page requests redirect to `/login` (with a safe `next` parameter for the original page);
- `/staff` requests redirect to `/login?next=/staff` after authentication;
- protected API requests return `401` JSON instead of private data.

| Area | URL | Who can access |
| --- | --- | --- |
| Home | `/` | Everyone — hero, live status, latest announcements, Discord. Signed-out visitors see Login and Register. |
| Sign in | `/login` | Everyone; already-signed-in users are redirected to their dashboard. |
| Create account | `/register` | Everyone; registers a Player account with email and password. |
| Dashboard | `/dashboard` | Any signed-in account — email, role, account details and sign out. |
| Profile | `/profile` | Any signed-in account — profile summary, password change and account shortcuts. |
| Players | `/players` | Any signed-in account — searchable directory grouped by category. |
| Announcements | `/announcements` | Any signed-in account — full list with publication dates. |
| Staff panel | `/staff` | `staff`, `moderator`, `admin` and `owner` only. |
| Admin dashboard | `/admin` | `admin` and `owner` only — opens the staff panel on the Accounts section. |
| Owner console | `/owner` | `owner` only — staff panel scoped to overview, accounts, settings and the owner's account. |
| Account API | `/api/admin/accounts` | `admin` and `owner` only. |

`/staff/login` redirects to `/login?next=/staff`.

### Roles and accounts

| Role | Site access | Staff panel | Accounts and roles |
| --- | --- | --- | --- |
| `owner` | Full | Full | Can manage every account except owners. Protected from deletion and demotion. |
| `admin` | Full | Full | Can manage moderators, staff and players. Cannot manage admins or the owner. |
| `moderator` | Full | Read-only | No account management. |
| `staff` | Full | Read-only | No account management. |
| `player` | Full | No access | `/staff` redirects home. |

- Public registration always creates **Player** accounts. Only authorized admins can assign staff roles.
- The login field accepts an email address or a username. Registered accounts sign in with their email; older/admin-created accounts without an email use their username.
- Changing a role, disabling an account or resetting its password revokes its sessions. A disabled account cannot sign in.
- The site never invents users, login successes or statistics.

### Staff panel

- **Overview** — counts and shortcuts, scoped to the signed-in role.
- **Players** — admin/owner: add, edit and delete roster entries.
- **Accounts** — admin/owner: create accounts, assign roles, reset passwords, disable/enable and delete accounts.
- **Announcements** — admin/owner: publish, edit and delete announcements.
- **My account** — change your own password (current password required); other sessions are signed out.
- **Site settings** — admin/owner: headline, subtitle, server address, Discord invite.
- **Sign out** is available in the site header, mobile menu and staff sidebar.

---

## Server status

The homepage and dashboard query the public [mcstatus.io](https://mcstatus.io) API:

```
https://api.mcstatus.io/v2/status/java/demonmc.mcpe.network
```

- Results are cached for 30 seconds; the widget refreshes client-side.
- If the API is unreachable, the widget shows `Offline` instead of failing the page.
- Change the address in **Settings → Server address**, or override with `MC_STATUS_HOST`.
- Set `MC_EDITION=bedrock` only if the network is Bedrock-only.

---

## Data and backups

PostgreSQL is now the source of truth. Use your provider's automated backups / point-in-time recovery, or:

```bash
pg_dump "$DATABASE_URL" --no-owner --format=custom --file=demonmc.dump
```

The old SQLite file is only needed for migration. Archive it after production verification; the migration script never deletes or modifies it.

Uploaded avatars are not stored — Minecraft heads are loaded from `mc-heads.net` by username, with a generated fallback avatar.

---

## Self-hosted production

```bash
npm ci
npm run migrate:sqlite   # existing SQLite data, fresh PostgreSQL only
# or: npm run setup      # new installation
npm run build
npm start                # serves on PORT (default 3000)
```

Production notes:

1. **Use HTTPS.** Session cookies are `Secure` when `NODE_ENV=production`.
2. **Keep `DATABASE_URL` private.** It is read only on the server.
3. **Forward proxy headers** (`X-Forwarded-For` / `X-Real-IP`) so login and registration limits see the real visitor IP.
4. **Use a pooler** if you run many app instances; each instance opens at most five connections.
5. **Run as a service.** Keep the process alive with systemd, PM2 or Docker.

Minimal nginx proxy:

```nginx
server {
    listen 443 ssl;
    server_name demonmc.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## Security notes

- **Server-side authentication only.** Credentials are validated in route handlers; the browser never receives password hashes or session tokens beyond its HttpOnly cookie.
- Passwords are hashed with **bcrypt (12 rounds)**; existing hashes are copied unchanged during migration. Plaintext is never stored or logged.
- Sessions use random 32-byte tokens in an **HttpOnly, SameSite=Lax** cookie (`Secure` in production). Only the SHA-256 hash is stored in PostgreSQL; sessions expire after **7 days**.
- **Mandatory gate.** Middleware redirects unauthenticated pages and returns `401` for API routes. Layouts and handlers re-check the session and role.
- **Role checks per request.** Admin/owner checks are enforced in the API, not just in the UI.
- **Brute-force protection.** A username/email locks after **5 failures** and an IP after **25 failures** in 15 minutes. Registration is limited to 10 attempts per IP per 15 minutes. Password changes are limited to 5 attempts per account. All counters are stored in PostgreSQL, so limits work across serverless instances.
- **Session revocation.** Disabling an account, changing its role or resetting its password deletes sessions immediately.
- **CSRF protection.** State-changing requests verify the request origin; all input is validated on the server.
- **SQL injection protection.** Every query is parameterized.
- **Secret isolation.** `DATABASE_URL` and setup credentials are server-only. Never use `NEXT_PUBLIC_` for them and never commit `.env`.

---

## Project structure

```
app/
  login/                  sign-in page (public)
  register/               player registration page (public)
  (site)/                 site layout: public home, signed-in players, announcements, dashboard, profile
  staff/                  protected dashboard
  admin/                  admin dashboard (admin and owner)
  owner/                  owner console (owner only)
  api/auth/               login, register, logout, current session, password change
  api/admin/              accounts, players, announcements, settings, overview
components/
  login-form.tsx          client sign-in form
  register-form.tsx       email/password registration
  profile-settings.tsx    profile page password change
  staff/                  role-aware dashboard tabs
lib/
  db.ts                   PostgreSQL pool, schema and query helpers
  auth.ts                 bcrypt, sessions, current user
  login-guard.ts          PostgreSQL-backed lockouts
  queries.ts              accounts, players, announcements
  settings.ts             site settings
  validation.ts           server-side input validation
middleware.ts             mandatory login redirect / API 401 gate
scripts/setup.ts          first-run schema + owner account
scripts/migrate-to-postgres.ts   read-only SQLite → PostgreSQL migration
data/demonmc.db           legacy SQLite source (migration only; not used at runtime)
```

### npm scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Development server on port 3000. |
| `npm run build` | Production build. |
| `npm start` | Serve the production build. |
| `npm run setup` | Create schema and the owner account on a new PostgreSQL database. |
| `npm run migrate:sqlite` | Copy existing SQLite data into an empty PostgreSQL database. |

---

## Troubleshooting

- **`DATABASE_URL is not set`** — add the connection string to `.env` (local) or Vercel environment variables, then restart/redeploy.
- **SSL / certificate errors** — use the provider's pooled URL with `?sslmode=require`. For local PostgreSQL without TLS, use `?sslmode=disable`.
- **`too many clients` / connection limits** — use the provider's pooled endpoint; each app instance caps its pool at five connections.
- **Migration says the target is not empty** — use a fresh PostgreSQL database. The script will not overwrite existing users. Do not delete the SQLite source.
- **Migration says SQLite changed while reading** — stop the site (including `next dev`/`next start`) and retry.
- **Owner login fails after migration** — use the same password as before; hashes are preserved. If the account is locked, wait out the 15-minute window. If the password is lost, reset the owner's hash with a one-off bcrypt script or restore a database backup.
- **`node:sqlite` warning in the migration** — `node:sqlite` is used only to read the legacy file. Node 24 is recommended.
- **Vercel deploys but pages return 500** — check the function logs for a missing/invalid `DATABASE_URL`, SSL mode, or database permissions.
- **Status shows Offline** — verify the server address, that the server is online, and that the host can reach `api.mcstatus.io`.
- **"An account with that email already exists"** — emails are unique and case-insensitive. Use login or have an admin reset the password.
- **"Too many failed sign-in attempts"** — wait out the 15-minute window. Counters live in `auth_attempts`, so they survive restarts and work across instances.
# DemonMC-Test
