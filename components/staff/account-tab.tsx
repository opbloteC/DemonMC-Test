"use client";

import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { LockIcon } from "@/components/icons";
import { formatDate } from "@/lib/format";
import { ROLE_LABELS, type SessionUser } from "@/lib/types";
import { apiRequest, ErrorNote, errorMessage, Field, PageSectionHeader, type Notify } from "./ui";

export function AccountTab({ user, notify }: { user: SessionUser; notify: Notify }) {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (form.next !== form.confirm) {
      setError("New password and confirmation do not match.");
      return;
    }

    setPending(true);
    try {
      await apiRequest<{ ok: boolean }>("/api/auth/password", {
        method: "POST",
        body: { currentPassword: form.current, newPassword: form.next },
      });
      setForm({ current: "", next: "", confirm: "" });
      notify("Password updated. Other active sessions were signed out.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <PageSectionHeader
        title="My account"
        description="Your DemonMC account details and password."
      />

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.35fr]">
        <div className="panel h-fit p-5">
          <div className="flex items-center gap-3">
            <Avatar name={user.username} src={user.avatarUrl} size={46} />
            <div className="min-w-0">
              <p className="truncate font-display text-base font-semibold text-white">{user.username}</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ember">
                {ROLE_LABELS[user.role]}
              </p>
            </div>
          </div>

          <dl className="mt-5 space-y-2.5 border-t border-white/[0.05] pt-4 text-xs">
            <div className="flex items-center justify-between">
              <dt className="text-zinc-500">Joined</dt>
              <dd className="text-zinc-300">{formatDate(user.joinedAt)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-zinc-500">Session</dt>
              <dd className="flex items-center gap-1.5 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Active · expires in 7 days
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-zinc-500">Password</dt>
              <dd className="text-zinc-300">Hashed with bcrypt</dd>
            </div>
          </dl>

          <p className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-[11px] leading-relaxed text-zinc-600">
            Password changes require your current password and are rate-limited. All other signed-in
            devices are logged out.
          </p>
        </div>

        <form onSubmit={submit} className="panel h-fit p-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.02] text-ember">
              <LockIcon width={15} height={15} />
            </span>
            <div>
              <h3 className="font-display text-sm font-semibold text-white">Change password</h3>
              <p className="text-[11px] text-zinc-600">Choose a strong password you do not use elsewhere.</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <Field label="Current password" htmlFor="account-current">
              <input
                id="account-current"
                type="password"
                className="input"
                autoComplete="current-password"
                required
                value={form.current}
                onChange={(event) => {
                  setForm((current) => ({ ...current, current: event.target.value }));
                  if (error) setError("");
                }}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="New password"
                htmlFor="account-next"
                hint="At least 10 characters, with a letter and a number."
              >
                <input
                  id="account-next"
                  type="password"
                  className="input"
                  autoComplete="new-password"
                  required
                  minLength={10}
                  maxLength={200}
                  value={form.next}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, next: event.target.value }));
                    if (error) setError("");
                  }}
                />
              </Field>

              <Field label="Confirm new password" htmlFor="account-confirm">
                <input
                  id="account-confirm"
                  type="password"
                  className="input"
                  autoComplete="new-password"
                  required
                  minLength={10}
                  maxLength={200}
                  value={form.confirm}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, confirm: event.target.value }));
                    if (error) setError("");
                  }}
                />
              </Field>
            </div>
          </div>

          {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}

          <div className="mt-5 flex justify-end">
            <button type="submit" disabled={pending} className="btn-primary !py-2.5 text-xs">
              {pending ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
