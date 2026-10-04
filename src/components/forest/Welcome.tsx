import { GROVES, type GroveId } from "@/data/concepts";
import { SearchBox } from "./SearchBox";

const STARTERS: GroveId[] = ["alg", "disc", "calc", "lin", "prob", "opt"];

function ForestBackdrop() {
  const layer = (n: number, y: number, h: number, fill: string, seed: number) =>
    Array.from({ length: n }, (_, i) => {
      const x = (i / (n - 1)) * 1600 - 40 + ((i * seed) % 37);
      const hh = h * (0.75 + ((i * seed) % 5) / 10);
      return <path key={i} d={`M${x} ${y} L${x - hh * 0.32} ${y} L${x} ${y - hh} L${x + hh * 0.32} ${y} Z`} fill={fill} />;
    });
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="wsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sky-top)" />
          <stop offset="1" stopColor="var(--cream)" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#wsky)" />
      <circle cx="1250" cy="170" r="70" fill="var(--gold)" opacity="0.55" />
      <g className="drift" opacity="0.8">
        <ellipse cx="300" cy="150" rx="120" ry="26" fill="var(--cream)" />
        <ellipse cx="900" cy="110" rx="160" ry="30" fill="var(--cream)" />
      </g>
      <path d="M0 640 Q400 520 800 600 T1600 560 L1600 900 L0 900 Z" fill="var(--moss)" opacity="0.5" />
      <g opacity="0.45">{layer(26, 650, 220, "var(--forest)", 7)}</g>
      <path d="M0 740 Q500 660 900 720 T1600 700 L1600 900 L0 900 Z" fill="var(--forest)" opacity="0.7" />
      <g>{layer(18, 780, 300, "var(--forest-deep)", 11)}</g>
      <rect y="800" width="1600" height="100" fill="var(--bark-dark)" opacity="0.85" />
    </svg>
  );
}

export function Welcome({ onPick, onGrove, onBegin }: { onPick: (id: string) => void; onGrove: (g: GroveId) => void; onBegin: () => void }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <ForestBackdrop />
      <div className="relative z-10 w-full max-w-2xl animate-fade-in rounded-3xl border-4 border-bark parchment-panel px-6 py-10 text-center md:px-12">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-forest">A mathematical atlas</p>
        <h1 className="mt-3 text-5xl font-bold text-bark-dark md:text-7xl">Knowledge Forest</h1>
        <p className="mt-4 font-display text-xl italic text-bark">Every concept has roots. Every concept grows branches.</p>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground">Tell us a math concept. We’ll help you visualize what concepts come before and after.</p>
        <div className="mx-auto mt-6 max-w-lg">
          <SearchBox onPick={onPick} large autoFocus placeholder="Try “gradient” or “bayes”…" />
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2" aria-label="Starter groves">
          {STARTERS.map((g) => (
            <button key={g} onClick={() => onGrove(g)} className="btn-forest">{GROVES.find((x) => x.id === g)!.name}</button>
          ))}
        </div>
        <button onClick={onBegin} className="btn-hero mt-8">Begin with algebra →</button>
      </div>
    </main>
  );
}
