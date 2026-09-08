export default function CircularRing({ progress, icon }) {
  const R   = 15;
  const C   = 2 * Math.PI * R;
  // Clamp strictly to 0-100 regardless of what the server sends
  const pct = Math.min(Math.max(Number(progress) || 0, 0), 100);
  const offset = C * (1 - pct / 100);

  return (
    <div className="stage-ring-wrap">
      <svg width="44" height="44" viewBox="0 0 44 44" style={{ position: 'absolute', top: 0, left: 0 }}>
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        {/* White fill so icon is legible */}
        <circle cx="22" cy="22" r={R} fill="white" />
        {/* Grey track */}
        <circle cx="22" cy="22" r={R} fill="none" stroke="#e2e8f0" strokeWidth="3" />
        {/* Coloured arc */}
        <circle
          cx="22" cy="22" r={R}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          transform="rotate(-90 22 22)"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      {/* Icon centred over ring */}
      <span className="stage-ring-icon">{icon}</span>
    </div>
  );
}
