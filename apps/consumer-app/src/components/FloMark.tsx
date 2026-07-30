/** Same mark as gateway-web's brand/Logo.tsx — one integration point, funds fanning out across three rails. */
export function FloMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden role="presentation">
      <defs>
        <linearGradient id="flomark-wallet-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="55%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="#0b1220" />
      <path d="M13 12 V28" stroke="url(#flomark-wallet-gradient)" strokeWidth="3" strokeLinecap="round" />
      <path d="M13 20 C20 20 22 12 31 12" fill="none" stroke="#3b82f6" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M13 20 H33" stroke="#8b5cf6" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M13 20 C20 20 22 28 31 28" fill="none" stroke="#10b981" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}
