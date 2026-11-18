"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogoutIcon } from "@/components/icons";

export function SignOutButton({
  iconOnly = false,
  className = "icon-btn",
}: {
  iconOnly?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    if (pending) return;
    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // The redirect still takes the visitor back to the login screen.
    }
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={pending}
      aria-label={pending ? "Signing out" : "Sign out"}
      className={className}
    >
      <LogoutIcon width={iconOnly ? 15 : 14} height={iconOnly ? 15 : 14} />
      {!iconOnly && (pending ? "Signing out…" : "Sign out")}
    </button>
  );
}
