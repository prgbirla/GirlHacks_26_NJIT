import { memo } from "react";

/** Inline SVG tree species, one per grove. Each symbol uses viewBox -30 -30 60 60. */
export const TreeSymbols = memo(function TreeSymbols() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <symbol id="tree-oak" viewBox="-30 -30 60 60">
          <rect x="-3" y="4" width="6" height="20" rx="2" fill="var(--trunk)" />
          <circle cx="-10" cy="0" r="11" fill="var(--leaf-oak)" />
          <circle cx="10" cy="0" r="11" fill="var(--leaf-oak)" />
          <circle cx="0" cy="-10" r="13" fill="var(--leaf-oak)" />
          <circle cx="4" cy="2" r="9" fill="var(--leaf-shade)" />
        </symbol>
        <symbol id="tree-maple" viewBox="-30 -30 60 60">
          <rect x="-2.5" y="6" width="5" height="18" fill="var(--trunk)" />
          <path d="M0 -24 L7 -12 L18 -14 L13 -2 L22 4 L10 8 L0 10 L-10 8 L-22 4 L-13 -2 L-18 -14 L-7 -12 Z" fill="var(--leaf-maple)" />
          <path d="M0 -12 L6 0 L0 8 L-6 0 Z" fill="var(--leaf-shade)" />
        </symbol>
        <symbol id="tree-cypress" viewBox="-30 -30 60 60">
          <rect x="-2" y="14" width="4" height="10" fill="var(--trunk)" />
          <path d="M0 -27 C10 -14 11 6 0 16 C-11 6 -10 -14 0 -27 Z" fill="var(--leaf-cypress)" />
          <path d="M0 -20 C5 -10 5 4 0 12 Z" fill="var(--leaf-shade)" />
        </symbol>
        <symbol id="tree-birch" viewBox="-30 -30 60 60">
          <rect x="-3" y="-4" width="6" height="28" fill="var(--trunk-birch)" />
          <rect x="-3" y="4" width="4" height="1.6" fill="var(--bark-dark)" />
          <rect x="0" y="12" width="3" height="1.6" fill="var(--bark-dark)" />
          <rect x="-3" y="18" width="3" height="1.4" fill="var(--bark-dark)" />
          <ellipse cx="-6" cy="-10" rx="10" ry="9" fill="var(--leaf-birch)" />
          <ellipse cx="7" cy="-13" rx="9" ry="10" fill="var(--leaf-birch)" />
          <ellipse cx="2" cy="-4" rx="7" ry="5" fill="var(--leaf-shade)" />
        </symbol>
        <symbol id="tree-sequoia" viewBox="-30 -30 60 60">
          <path d="M-4 24 L-3 -6 L3 -6 L4 24 Z" fill="var(--trunk-red)" />
          <ellipse cx="0" cy="-20" rx="8" ry="7" fill="var(--leaf-sequoia)" />
          <ellipse cx="-6" cy="-9" rx="9" ry="5" fill="var(--leaf-sequoia)" />
          <ellipse cx="7" cy="-3" rx="9" ry="5" fill="var(--leaf-sequoia)" />
          <ellipse cx="-5" cy="5" rx="7" ry="4" fill="var(--leaf-sequoia)" />
        </symbol>
        <symbol id="tree-pine" viewBox="-30 -30 60 60">
          <rect x="-2.5" y="14" width="5" height="10" fill="var(--trunk)" />
          <path d="M0 -26 L12 -8 L5 -8 L16 6 L7 6 L19 16 L-19 16 L-7 6 L-16 6 L-5 -8 L-12 -8 Z" fill="var(--leaf-pine)" />
          <path d="M0 -26 L12 -8 L5 -8 L16 6 L7 6 L19 16 L0 16 Z" fill="var(--leaf-shade)" />
        </symbol>
        <symbol id="tree-willow" viewBox="-30 -30 60 60">
          <path d="M-3 24 C-2 10 -1 0 0 -8 C1 0 2 10 3 24 Z" fill="var(--trunk)" />
          <ellipse cx="0" cy="-12" rx="18" ry="11" fill="var(--leaf-willow)" />
          {[-15, -9, -3, 3, 9, 15].map((x) => (
            <path key={x} d={`M${x} -8 Q${x + 2} 6 ${x} 16`} stroke="var(--leaf-willow)" strokeWidth="4" strokeLinecap="round" fill="none" />
          ))}
        </symbol>
        <symbol id="tree-ginkgo" viewBox="-30 -30 60 60">
          <rect x="-2.5" y="2" width="5" height="22" fill="var(--trunk)" />
          <path d="M0 2 L-20 -10 A20 20 0 0 1 -4 -24 Z" fill="var(--leaf-ginkgo)" />
          <path d="M0 2 L4 -24 A20 20 0 0 1 20 -10 Z" fill="var(--leaf-ginkgo)" />
          <path d="M0 4 L-16 2 A16 16 0 0 1 16 2 Z" fill="var(--leaf-ginkgo)" opacity="0.85" />
        </symbol>
        <symbol id="tree-cedar" viewBox="-30 -30 60 60">
          <rect x="-3" y="2" width="6" height="22" fill="var(--trunk)" />
          <ellipse cx="0" cy="-20" rx="9" ry="4" fill="var(--leaf-cedar)" />
          <ellipse cx="0" cy="-11" rx="16" ry="4.5" fill="var(--leaf-cedar)" />
          <ellipse cx="0" cy="-1" rx="22" ry="5" fill="var(--leaf-cedar)" />
          <ellipse cx="5" cy="-1" rx="12" ry="3" fill="var(--leaf-shade)" />
        </symbol>
      </defs>
    </svg>
  );
});

export function TreeIcon({ variant, size = 48, className }: { variant: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="-30 -30 60 60" className={className} aria-hidden="true">
      <use href={`#tree-${variant}`} x="-30" y="-30" width="60" height="60" />
    </svg>
  );
}

export function Medallion({ variant, size = 120 }: { variant: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100" aria-hidden="true">
      <circle r="46" className="rim" />
      <circle r="38" className="socket" />
      <g className="sway"><use href={`#tree-${variant}`} x="-30" y="-32" width="60" height="60" /></g>
    </svg>
  );
}
