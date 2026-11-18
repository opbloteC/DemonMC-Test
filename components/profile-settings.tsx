"use client";

import { useEffect, useRef, useState } from "react";
import { AccountTab } from "@/components/staff/account-tab";
import type { Notify } from "@/components/staff/ui";
import type { SessionUser } from "@/lib/types";

export function ProfileSettings({ user }: { user: SessionUser }) {
  const [toast, setToast] = useState("");
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const notify: Notify = (message) => {
    setToast(message);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(""), 4200);
  };

  return (
    <div>
      {toast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-[100] rounded-lg border border-emerald-400/20 bg-ink-900/95 px-4 py-3 text-sm text-emerald-300 shadow-panel backdrop-blur"
        >
          {toast}
        </div>
      )}
      <AccountTab user={user} notify={notify} />
    </div>
  );
}
