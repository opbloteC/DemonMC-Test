"use client";

import { useState } from "react";

const MC_NAME = /^[A-Za-z0-9_]{1,16}$/;
const FALLBACK_SKIN = "MHF_Steve";

function sourcesFor(username: string, px: number): string[] {
  const local = "/mc-avatar-default.svg";
  const defaultAvatar = `https://mc-heads.net/avatar/${FALLBACK_SKIN}/${px}`;

  if (!MC_NAME.test(username)) return [defaultAvatar, local];

  return [
    `https://minotar.net/helm/${encodeURIComponent(username)}/${px}.png`,
    `https://mc-heads.net/avatar/${encodeURIComponent(username)}/${px}`,
    defaultAvatar,
    local,
  ];
}

export function MinecraftAvatar({
  username,
  size = 72,
  className = "",
}: {
  username: string;
  size?: number;
  className?: string;
}) {
  const px = Math.min(256, Math.max(64, Math.round(size * 2)));
  const [index, setIndex] = useState(0);
  const sources = sourcesFor(username, px);
  const src = sources[Math.min(index, sources.length - 1)];

  return (
    <span
      className={`mc-avatar inline-flex shrink-0 overflow-hidden rounded-xl border border-white/10 bg-ink-800 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        src={src}
        alt={`${username} Minecraft avatar`}
        width={size}
        height={size}
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setIndex((current) => Math.min(current + 1, sources.length - 1))}
        className="h-full w-full object-cover"
        style={{ imageRendering: "pixelated" }}
      />
    </span>
  );
}
