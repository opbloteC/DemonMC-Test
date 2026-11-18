"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/icons";

export function CopyIp({ ip }: { ip: string }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    const legacyCopy = () => {
      const area = document.createElement("textarea");
      area.value = ip;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      if (!ok) throw new Error("copy rejected");
    };

    try {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(ip);
        } catch {
          legacyCopy();
        }
      } else {
        legacyCopy();
      }
      setState("copied");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setState("idle"), 2200);
    } catch {
      setState("error");
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink-900/80 p-2 pl-4 shadow-[0_18px_50px_-30px_rgba(255,45,63,0.4)] backdrop-blur transition-colors hover:border-ember/30">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          IP
        </span>
        <code className="min-w-0 flex-1 truncate text-left font-mono text-sm text-zinc-100 sm:text-[15px]">
          {ip}
        </code>
        <button type="button" onClick={copy} className="btn-primary !px-4 !py-2.5 text-xs">
          {state === "copied" ? <CheckIcon width={15} height={15} /> : <CopyIcon width={15} height={15} />}
          {state === "copied" ? "Copied" : state === "error" ? "Copy failed" : "Copy IP"}
        </button>
      </div>
      <p className="mt-2.5 text-center text-[11px] text-zinc-500">
        Java Edition · add it in Minecraft → Multiplayer
      </p>
    </div>
  );
}
