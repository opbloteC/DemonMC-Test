export function LogoMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 48 48" width="100%" height="100%" role="img" aria-label="DemonMC logo">
        <defs>
          <linearGradient id="dm-logo-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff5866" />
            <stop offset="1" stopColor="#a10d1c" />
          </linearGradient>
          <linearGradient id="dm-logo-face" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.09" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x="1.5" y="1.5" width="45" height="45" rx="10" fill="#0b0b0e" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
        <rect x="1.5" y="1.5" width="45" height="45" rx="10" fill="url(#dm-logo-face)" />
        <rect x="1.5" y="1.5" width="45" height="45" rx="10" fill="none" stroke="rgba(255,45,63,0.35)" strokeWidth="1" />
        <path
          d="M16 12.5h9.6C32.9 12.5 37.5 17 37.5 24s-4.6 11.5-11.9 11.5H16v-23Zm7 6.2v10.6h2.4c3.4 0 5.2-1.9 5.2-5.3s-1.8-5.3-5.2-5.3h-2.4Z"
          fill="url(#dm-logo-grad)"
        />
      </svg>
    </span>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-extrabold uppercase leading-none tracking-[0.06em] text-white ${className}`}>
      DEMON<span className="text-ember">MC</span>
    </span>
  );
}
