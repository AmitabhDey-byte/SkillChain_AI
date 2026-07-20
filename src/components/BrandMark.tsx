type BrandMarkProps = {
  compact?: boolean
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <span className={compact ? 'cosmic-brand cosmic-brand--compact' : 'cosmic-brand'}>
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <defs>
          <linearGradient id="brand-spectrum" x1="5" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#65F4FF" />
            <stop offset=".45" stopColor="#A978FF" />
            <stop offset="1" stopColor="#FF678E" />
          </linearGradient>
        </defs>
        <path d="M24 4 40.5 13.5v19L24 42 7.5 32.5v-19L24 4Z" fill="none" stroke="url(#brand-spectrum)" strokeWidth="2.3" />
        <path d="m15 27 9-15 9 15-9 9-9-9Z" fill="url(#brand-spectrum)" fillOpacity=".22" stroke="url(#brand-spectrum)" strokeWidth="1.8" />
        <circle cx="24" cy="24" r="3.6" fill="#E8FCFF" />
        <circle cx="24" cy="24" r="8.8" fill="none" stroke="#65F4FF" strokeDasharray="2 4" />
      </svg>
      {!compact && <span><strong>SkillChain</strong><small>PROOF OS</small></span>}
    </span>
  )
}
