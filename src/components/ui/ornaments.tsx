/** Ornamentos botânicos leves, no estilo aquarela da marca. */

export function Sprig({ className, flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 140"
      fill="none"
      aria-hidden
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path d="M14 134C34 104 56 70 98 14" stroke="var(--sage-400)" strokeWidth="1.6" strokeLinecap="round" />
      {[
        [30, 104, -38],
        [44, 84, 32],
        [54, 70, -36],
        [66, 52, 34],
        [78, 38, -34],
        [90, 24, 30],
      ].map(([x, y, r], i) => (
        <ellipse
          key={i}
          cx={x}
          cy={y}
          rx="13"
          ry="5.6"
          transform={`rotate(${r} ${x} ${y})`}
          fill={i % 2 ? "var(--sage-200)" : "var(--sage-100)"}
          stroke="var(--sage-300)"
          strokeWidth="1"
        />
      ))}
      <circle cx="101" cy="11" r="3" fill="var(--gold-300)" />
    </svg>
  );
}

export function Heart({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
