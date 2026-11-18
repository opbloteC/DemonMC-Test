"use client";

import { useState } from "react";
import { avatarFor } from "@/lib/format";

export function Avatar({
  name,
  src,
  size = 56,
  className = "",
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  if (!src || failed) {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex shrink-0 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br from-ink-700 to-ink-900 font-display font-bold text-zinc-400 ${className}`}
        style={{ width: size, height: size, fontSize: Math.max(14, size * 0.36) }}
      >
        {initial}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarFor(name, src)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-lg border border-white/10 bg-ink-800 object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
