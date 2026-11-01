function BookShelfIllustration() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" role="img" aria-label="" preserveAspectRatio="xMidYMax meet">
      <circle cx="292" cy="100" r="52" fill="#F6E6E2" />
      <rect x="60" y="232" width="280" height="8" rx="4" fill="#D9C7AE" />
      <g>
        <rect x="92" y="100" width="46" height="132" rx="4" fill="#B84A3A" />
        <rect x="92" y="128" width="46" height="6" fill="#FFFFFF" opacity="0.55" />
        <rect x="92" y="196" width="46" height="6" fill="#FFFFFF" opacity="0.55" />
        <rect x="144" y="128" width="40" height="104" rx="4" fill="#71816D" />
        <rect x="144" y="150" width="40" height="5" fill="#FFFFFF" opacity="0.5" />
        <rect x="144" y="200" width="40" height="5" fill="#FFFFFF" opacity="0.5" />
        <rect x="190" y="84" width="52" height="148" rx="4" fill="#252522" />
        <rect x="190" y="112" width="52" height="6" fill="#D9C7AE" />
        <rect x="190" y="206" width="52" height="6" fill="#D9C7AE" />
        <rect x="248" y="116" width="42" height="116" rx="4" fill="#963B30" />
        <rect x="248" y="142" width="42" height="5" fill="#FFFFFF" opacity="0.5" />
        <rect x="248" y="196" width="42" height="5" fill="#FFFFFF" opacity="0.5" />
        <g transform="rotate(14 340 232)">
          <rect x="296" y="124" width="44" height="108" rx="4" fill="#D9C7AE" />
          <rect x="296" y="152" width="44" height="5" fill="#B84A3A" opacity="0.8" />
          <rect x="296" y="196" width="44" height="5" fill="#B84A3A" opacity="0.8" />
        </g>
      </g>
    </svg>
  )
}

export default function LoginShowcase() {
  return (
    <div className="relative aspect-[4/5] w-full max-w-sm" aria-hidden="true">
      <div className="absolute inset-0 translate-x-4 translate-y-4 rotate-3 rounded-card border border-border bg-surface/70" />
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-card border border-border bg-surface shadow-card">
        <div className="flex min-h-0 flex-1 items-end justify-center bg-surface-muted px-6 pt-8"><BookShelfIllustration /></div>
        <div className="px-8 py-6 text-center">
          <p lang="ja" className="jp text-5xl font-bold leading-tight">図書館</p>
          <p lang="ja" className="jp mt-1 text-xl text-ink-muted">としょかん</p>
          <p className="mt-3 text-base text-ink-muted">toshokan</p>
        </div>
      </div>
    </div>
  )
}
