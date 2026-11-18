"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeOffIcon, ShieldIcon } from "@/components/icons";

interface FieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isStrongPassword(value: string): boolean {
  return value.length >= 10 && value.length <= 200 && /[A-Za-z]/.test(value) && /\d/.test(value);
}

export function RegisterForm({ autoFocus = true }: { autoFocus?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!EMAIL_PATTERN.test(email.trim())) next.email = "Enter a valid email address.";
    if (!isStrongPassword(password)) {
      next.password = "Use 10+ characters with at least one letter and one number.";
    }
    if (confirmPassword !== password) next.confirmPassword = "Passwords do not match.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setError("");
    if (!validate()) return;

    setPending(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          confirmPassword,
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;

      if (!res.ok) {
        setError(data?.error ?? "Unable to create your account. Please try again.");
        setPending(false);
        return;
      }

      router.replace("/login?registered=1");
      router.refresh();
    } catch {
      setError("Network error. Check your connection and try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} method="post" action="/register" className="mt-6 space-y-4" noValidate>
      <div>
        <label htmlFor="register-email" className="label">
          Email address
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          autoFocus={autoFocus}
          maxLength={254}
          disabled={pending}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (fieldErrors.email) setFieldErrors((current) => ({ ...current, email: undefined }));
            if (error) setError("");
          }}
          aria-invalid={Boolean(fieldErrors.email)}
          className="input"
          placeholder="you@example.com"
        />
        {fieldErrors.email && (
          <p className="mt-1.5 text-[11px] text-ember-bright">{fieldErrors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="register-password" className="label">
          Password
        </label>
        <div className="relative">
          <input
            id="register-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            maxLength={200}
            disabled={pending}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (fieldErrors.password) {
                setFieldErrors((current) => ({ ...current, password: undefined }));
              }
              if (error) setError("");
            }}
            aria-invalid={Boolean(fieldErrors.password)}
            className="input pr-11"
            placeholder="10+ characters, letters and numbers"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-zinc-500 transition-colors hover:text-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ember/50"
          >
            {showPassword ? <EyeOffIcon width={16} height={16} /> : <EyeIcon width={16} height={16} />}
          </button>
        </div>
        {fieldErrors.password && (
          <p className="mt-1.5 text-[11px] text-ember-bright">{fieldErrors.password}</p>
        )}
      </div>

      <div>
        <label htmlFor="register-confirm" className="label">
          Confirm password
        </label>
        <div className="relative">
          <input
            id="register-confirm"
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            required
            maxLength={200}
            disabled={pending}
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              if (fieldErrors.confirmPassword) {
                setFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
              }
              if (error) setError("");
            }}
            aria-invalid={Boolean(fieldErrors.confirmPassword)}
            className="input pr-11"
            placeholder="Repeat your password"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((value) => !value)}
            aria-label={showConfirm ? "Hide confirmation password" : "Show confirmation password"}
            aria-pressed={showConfirm}
            className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-zinc-500 transition-colors hover:text-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ember/50"
          >
            {showConfirm ? <EyeOffIcon width={16} height={16} /> : <EyeIcon width={16} height={16} />}
          </button>
        </div>
        {fieldErrors.confirmPassword && (
          <p className="mt-1.5 text-[11px] text-ember-bright">{fieldErrors.confirmPassword}</p>
        )}
      </div>

      {error && (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-lg border border-ember/25 bg-ember/[0.07] px-3.5 py-2.5 text-xs leading-relaxed text-ember-bright"
        >
          {error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full !py-3">
        {pending ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Creating account…
          </>
        ) : (
          <>
            <ShieldIcon width={15} height={15} />
            Create account
          </>
        )}
      </button>
    </form>
  );
}
