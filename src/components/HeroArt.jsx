// Illustration du hero : ciel de nuit, lune, montagnes du Champsaur et une voile.
export default function HeroArt() {
  const stars = Array.from({ length: 40 }, (_, i) => ({
    x: (i * 137.5) % 1440,
    y: ((i * 71) % 360) + 10,
    r: (i % 3) * 0.5 + 0.6,
    d: (i % 5) * 0.8,
  }));

  return (
    <svg className="hero-art" viewBox="0 0 1440 720" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0b1430" />
          <stop offset="55%" stopColor="#24305e" />
          <stop offset="100%" stopColor="#7a6a9e" />
        </linearGradient>
        <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#f5d27a" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#f5d27a" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1440" height="720" fill="url(#sky)" />
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" className="star" style={{ animationDelay: `${s.d}s` }} />
      ))}

      <circle cx="1080" cy="190" r="190" fill="url(#glow)" />
      <circle cx="1080" cy="190" r="78" fill="#f5d27a" />
      <circle cx="1052" cy="172" r="12" fill="#e8bf5e" opacity="0.6" />
      <circle cx="1100" cy="215" r="8" fill="#e8bf5e" opacity="0.5" />

      <g className="glider">
        <path d="M0 0 Q36 -22 72 0" stroke="#ff8a5c" strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M4 1 L36 46 M68 1 L36 46 M20 -9 L36 46 M52 -9 L36 46" stroke="#e9ecf5" strokeWidth="1" opacity="0.8" />
        <circle cx="36" cy="50" r="5" fill="#e9ecf5" />
      </g>

      <path d="M0 520 L160 400 L260 460 L420 330 L560 450 L700 380 L860 470 L1000 360 L1160 450 L1300 390 L1440 460 L1440 720 L0 720 Z" fill="#3b4677" />
      <path d="M420 330 L470 370 L440 368 L420 385 L400 362 L380 365 Z M1000 360 L1040 392 L1012 390 L995 402 L978 388 Z" fill="#dfe4f2" opacity="0.9" />
      <path d="M0 600 L200 500 L340 560 L520 470 L700 560 L880 500 L1060 580 L1240 510 L1440 580 L1440 720 L0 720 Z" fill="#283260" />
      <path d="M0 670 L240 610 L480 650 L760 600 L1040 660 L1300 620 L1440 650 L1440 720 L0 720 Z" fill="#18204a" />
    </svg>
  );
}
