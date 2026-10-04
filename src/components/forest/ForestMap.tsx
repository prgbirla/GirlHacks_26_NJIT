import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { CONCEPTS, CONCEPT_BY_ID, GROVE_BY_ID, type GroveId } from "@/data/concepts";
import { LAYOUT, ancestorsOf, descendantsOf, displayName, radiusOf } from "@/lib/forest";

export interface ForestMapHandle {
  focusConcept: (id: string) => void;
  focusGrove: (g: GroveId) => void;
  wholeTree: () => void;
}

interface Props { selectedId: string | null; onSelect: (id: string) => void }

type Cam = { x: number; y: number; k: number };
const MIN_K = 0.06, MAX_K = 2.6;
const clampK = (k: number) => Math.min(MAX_K, Math.max(MIN_K, k));
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const EDGES = CONCEPTS.flatMap((c) => c.prerequisites.map((p) => ({ from: p, to: c.id })));
const HORIZONS = [
  { id: "data-science", from: "distributions", label: "Explore the Data Science Forest!", x: 5524, y: -1138, shape: "horizontal" },
  { id: "machine-learning", from: "gd", label: "Explore the Machine Learning Forest!", x: 3649, y: -2871, shape: "square" },
  { id: "engineering", from: "vecfields", label: "Explore the Engineering Forest!", x: 3622, y: -791, shape: "square" },
] as const;
const edgePath = (from: string, to: string) => {
  const a = LAYOUT.pos.get(from)!, b = LAYOUT.pos.get(to)!;
  const ra = radiusOf(CONCEPT_BY_ID.get(from)!), rb = radiusOf(CONCEPT_BY_ID.get(to)!);
  const y1 = a.y - ra - 4, y2 = b.y + rb + 26;
  const dy = Math.max(40, (y1 - y2) / 2);
  return `M${a.x} ${y1} C${a.x} ${y1 - dy}, ${b.x} ${y2 + dy}, ${b.x} ${y2}`;
};

const horizonEdgePath = (from: string, x: number, y: number) => {
  const a = LAYOUT.pos.get(from);
  const source = CONCEPT_BY_ID.get(from);
  if (!a || !source) return "";
  const r = radiusOf(source);
  const dx = x - a.x, dy = y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  const x1 = a.x + (dx / length) * (r + 8);
  const y1 = a.y + (dy / length) * (r + 8);
  return `M${x1} ${y1} C${x1 + dx * 0.34} ${y1}, ${x - dx * 0.22} ${y}, ${x} ${y}`;
};

export const ForestMap = forwardRef<ForestMapHandle, Props>(function ForestMap({ selectedId, onSelect }, ref) {
  const wrap = useRef<HTMLDivElement>(null);
  const layer = useRef<SVGGElement>(null);
  const cam = useRef<Cam>({ x: 0, y: 0, k: 0.2 });
  const anim = useRef<number | null>(null);
  const onSelectRef = useRef(onSelect); onSelectRef.current = onSelect;
  const selectStable = useCallback((id: string) => onSelectRef.current(id), []);

  const apply = useCallback(() => {
    const { x, y, k } = cam.current;
    layer.current?.setAttribute("transform", `translate(${x} ${y}) scale(${k})`);
  }, []);

  const animateTo = useCallback((target: Cam) => {
    if (anim.current) cancelAnimationFrame(anim.current);
    if (reduced()) { cam.current = target; apply(); return; }
    const start = { ...cam.current }; const t0 = performance.now(); const dur = 700;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - p, 3);
      cam.current = { x: start.x + (target.x - start.x) * e, y: start.y + (target.y - start.y) * e, k: start.k + (target.k - start.k) * e };
      apply();
      if (p < 1) anim.current = requestAnimationFrame(step);
    };
    anim.current = requestAnimationFrame(step);
  }, [apply]);

  const size = () => ({ w: wrap.current?.clientWidth ?? 800, h: wrap.current?.clientHeight ?? 600 });
  const fitBox = useCallback((minX: number, minY: number, maxX: number, maxY: number, maxK = 1.2) => {
    const { w, h } = size();
    const k = clampK(Math.min(maxK, Math.min(w / (maxX - minX), h / (maxY - minY)) * 0.92));
    animateTo({ k, x: w / 2 - ((minX + maxX) / 2) * k, y: h / 2 - ((minY + maxY) / 2) * k });
  }, [animateTo]);

  const api: ForestMapHandle = useMemo(() => ({
    focusConcept: (id) => {
      const p = LAYOUT.pos.get(id); if (!p) return;
      const { w, h } = size(); const k = 1.15;
      animateTo({ k, x: w / 2 - p.x * k, y: h / 2 - p.y * k });
    },
    focusGrove: (g) => {
      const lane = LAYOUT.lanes.find((l) => l.grove === g)!;
      fitBox(lane.x0, lane.topY, lane.x1, lane.bannerY + 40, 0.9);
    },
    wholeTree: () => { const b = LAYOUT.bounds; fitBox(b.minX, b.minY, b.maxX, b.maxY); },
  }), [animateTo, fitBox]);
  useImperativeHandle(ref, () => api, [api]);

  useEffect(() => {
    const b = LAYOUT.bounds; const { w, h } = size();
    const k = Math.min(w / (b.maxX - b.minX), h / (b.maxY - b.minY)) * 0.92;
    cam.current = { k, x: w / 2 - ((b.minX + b.maxX) / 2) * k, y: h / 2 - ((b.minY + b.maxY) / 2) * k };
    apply();
  }, [apply]);

  // pointer: drag, pinch, wheel
  useEffect(() => {
    const el = wrap.current!; const pts = new Map<number, { x: number; y: number }>();
    let moved = 0; let pinch: { d: number; k: number; cx: number; cy: number } | null = null;
    const zoomAt = (cx: number, cy: number, k2: number) => {
      const c = cam.current; const k = clampK(k2);
      cam.current = { k, x: cx - ((cx - c.x) / c.k) * k, y: cy - ((cy - c.y) / c.k) * k }; apply();
    };
    const local = (e: PointerEvent | WheelEvent) => { const r = el.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const down = (e: PointerEvent) => {
      if (anim.current) cancelAnimationFrame(anim.current);
      pts.set(e.pointerId, local(e)); moved = 0;
      if (pts.size === 2) {
        const [a, b] = [...pts.values()] as [{ x: number; y: number }, { x: number; y: number }];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), k: cam.current.k, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
      }
    };
    const move = (e: PointerEvent) => {
      const prev = pts.get(e.pointerId); if (!prev) return;
      const p = local(e); pts.set(e.pointerId, p);
      if (pts.size === 2 && pinch) {
        const [a, b] = [...pts.values()] as [{ x: number; y: number }, { x: number; y: number }];
        zoomAt(pinch.cx, pinch.cy, pinch.k * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.d)); moved += 10; return;
      }
      const dx = p.x - prev.x, dy = p.y - prev.y; moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 4) { el.setPointerCapture(e.pointerId); el.style.cursor = "grabbing"; }
      cam.current = { ...cam.current, x: cam.current.x + dx, y: cam.current.y + dy }; apply();
    };
    const up = (e: PointerEvent) => {
      pts.delete(e.pointerId); if (pts.size < 2) pinch = null; el.style.cursor = "grab";
      if (moved <= 4 && e.type === "pointerup") {
        const node = (e.target as Element).closest?.("[data-id]");
        if (node) onSelectRef.current(node.getAttribute("data-id")!);
      }
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault(); if (anim.current) cancelAnimationFrame(anim.current);
      const p = local(e); zoomAt(p.x, p.y, cam.current.k * Math.exp(-e.deltaY * 0.0015));
    };
    el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
    };
  }, [apply]);

  const onKey = (e: React.KeyboardEvent) => {
    const step = 80; const c = cam.current;
    const map: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (map[e.key] && (e.target as Element) === wrap.current) {
      e.preventDefault(); const [mx, my] = map[e.key]!; animateTo({ ...c, x: c.x + mx, y: c.y + my });
    } else if (e.key === "+" || e.key === "=") { const { w, h } = size(); animateTo({ k: clampK(c.k * 1.3), x: w / 2 - ((w / 2 - c.x) / c.k) * clampK(c.k * 1.3), y: h / 2 - ((h / 2 - c.y) / c.k) * clampK(c.k * 1.3) }); }
    else if (e.key === "-") { const { w, h } = size(); const k = clampK(c.k / 1.3); animateTo({ k, x: w / 2 - ((w / 2 - c.x) / c.k) * k, y: h / 2 - ((h / 2 - c.y) / c.k) * k }); }
  };

  const rel = useMemo(() => {
    if (!selectedId) return null;
    return { anc: ancestorsOf(selectedId), desc: descendantsOf(selectedId) };
  }, [selectedId]);

  return (
    <div
      ref={wrap}
      tabIndex={0}
      onKeyDown={onKey}
      role="application"
      aria-label="Knowledge forest map. Drag to pan, scroll or pinch to zoom, arrow keys to move, Tab to move between concepts."
      className="relative h-full w-full touch-none select-none overflow-hidden"
      style={{ cursor: "grab", background: "linear-gradient(180deg, var(--sky-top), var(--sky-bottom))" }}
    >
      <svg className="absolute inset-0 h-full w-full" role="presentation">
        <g ref={layer}>
          <Scenery />
          <EdgeLayer selectedId={selectedId} anc={rel?.anc} desc={rel?.desc} />
          <NodeLayer selectedId={selectedId} anc={rel?.anc} desc={rel?.desc} onPick={selectStable} />
           <HorizonLayer selectedId={selectedId} />
        </g>
      </svg>
      <Legend />
    </div>
  );
});

const Scenery = memo(function Scenery() {
  const b = LAYOUT.bounds;
  return (
    <g aria-hidden="true">
      {LAYOUT.lanes.map((l, i) => (
        <rect key={l.grove} x={l.x0} y={b.minY} width={l.x1 - l.x0} height={b.maxY - b.minY} fill={i % 2 ? "var(--lane-a)" : "var(--lane-b)"} />
      ))}
      {/* canopy */}
      {Array.from({ length: Math.ceil((b.maxX - b.minX) / 160) }, (_, i) => (
        <circle key={i} cx={b.minX + i * 160 + 80} cy={b.minY + 10} r={110 + (i % 3) * 25} fill="var(--forest)" opacity={0.25} />
      ))}
      {/* ground and roots */}
      <rect x={b.minX} y={140} width={b.maxX - b.minX} height={b.maxY} fill="var(--ground)" opacity={0.5} />
      {Array.from({ length: Math.ceil((b.maxX - b.minX) / 220) }, (_, i) => {
        const x = b.minX + i * 220 + 110;
        return <path key={i} d={`M${x} 150 C${x - 30} 190, ${x - 70} 200, ${x - 110} 250 M${x} 150 C${x + 20} 200, ${x + 60} 210, ${x + 90} 255`} stroke="var(--bark)" strokeWidth={6} fill="none" opacity={0.45} strokeLinecap="round" />;
      })}
      {LAYOUT.lanes.map((l) => {
        const g = GROVE_BY_ID.get(l.grove)!; const cx = (l.x0 + l.x1) / 2; const w = Math.max(220, g.name.length * 15 + 60);
        return (
          <g key={l.grove} transform={`translate(${cx} ${l.bannerY})`}>
            <rect x={-4} y={-10} width={8} height={70} fill="var(--bark-dark)" />
            <rect x={-w / 2} y={-28} width={w} height={48} rx={8} fill="var(--bark)" stroke="var(--bark-dark)" strokeWidth={4} />
            <rect x={-w / 2 + 8} y={-22} width={w - 16} height={36} rx={5} fill="none" stroke="var(--sandstone)" strokeOpacity={0.4} strokeWidth={1.5} />
            <text textAnchor="middle" y={5} className="banner-text">{g.name}</text>
          </g>
        );
      })}
    </g>
  );
});

interface RelProps { selectedId: string | null; anc?: Set<string> | undefined; desc?: Set<string> | undefined }

const EdgeLayer = memo(function EdgeLayer({ selectedId, anc, desc }: RelProps) {
  const highlighted: { d: string; kind: "pre" | "post" }[] = [];
  const paths = EDGES.map(({ from, to }) => {
    const d = edgePath(from, to);
    let cls = "edge";
    if (selectedId && anc && desc) {
      const pre = (anc.has(from)) && (anc.has(to) || to === selectedId);
      const post = (desc.has(to)) && (desc.has(from) || from === selectedId);
      if (pre) { cls += " pre"; highlighted.push({ d, kind: "pre" }); }
      else if (post) { cls += " post"; highlighted.push({ d, kind: "post" }); }
      else cls += " dim";
    }
    return <path key={`${from}-${to}`} d={d} className={cls} />;
  });
  return (
    <g aria-hidden="true">
      {paths}
      {highlighted.slice(0, 120).map((h, i) => (
        <g key={i} className="chevron-anim">
          {[0, 0.5].map((off) => (
            <path key={off} d="M-5 -4 L1 0 L-5 4 L-3 0 Z" className="chevron" transform="scale(1.6)">
              <animateMotion dur="3.2s" repeatCount="indefinite" rotate="auto" path={h.d} begin={`${off * -3.2}s`} />
            </path>
          ))}
        </g>
      ))}
    </g>
  );
});

const HorizonLayer = memo(function HorizonLayer({ selectedId }: { selectedId: string | null }) {
  return (
    <g aria-label="Future forests">
      {HORIZONS.map((horizon) => {
        const isHorizontal = horizon.shape === "horizontal";
        const width = isHorizontal ? 330 : 220;
        const height = isHorizontal ? 92 : 220;
        const dimmed = selectedId !== null && selectedId !== horizon.from;
        return (
          <g key={horizon.id} className={dimmed ? "horizon dim" : "horizon"}>
            <path d={horizonEdgePath(horizon.from, horizon.x, horizon.y)} className="horizon-edge" aria-hidden="true" />
            <g transform={`translate(${horizon.x} ${horizon.y})`}>
              <rect x={-width / 2} y={-height / 2} width={width} height={height} rx={isHorizontal ? 10 : 6} className="horizon-frame" />
              <rect x={-width / 2 + 9} y={-height / 2 + 9} width={width - 18} height={height - 18} rx={isHorizontal ? 6 : 3} className="horizon-inset" />
              <text textAnchor="middle" className="horizon-kicker" y={isHorizontal ? -12 : -30}>FUTURE HORIZON</text>
              <text textAnchor="middle" className="horizon-text">
                {isHorizontal ? (
                  <tspan x="0" y="18">{horizon.label}</tspan>
                ) : (
                  <>
                    <tspan x="0" y="4">Explore the</tspan>
                    <tspan x="0" dy="25">{horizon.id === "machine-learning" ? "Machine Learning" : "Engineering"}</tspan>
                    <tspan x="0" dy="25">Forest!</tspan>
                  </>
                )}
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
});

const NodeLayer = memo(function NodeLayer({ selectedId, anc, desc, onPick }: RelProps & { onPick: (id: string) => void }) {
  return (
    <g>
      {CONCEPTS.map((c) => {
        const p = LAYOUT.pos.get(c.id)!; const r = radiusOf(c);
        const isSel = c.id === selectedId; const isPre = !!anc?.has(c.id); const isPost = !!desc?.has(c.id);
        const dim = !!selectedId && !isSel && !isPre && !isPost;
        const name = displayName(c);
        const label = c.name.length > 22 ? c.name.slice(0, 21) + "…" : c.name;
        const pw = Math.max(70, label.length * 6.6 + 16);
        const relText = isSel ? "selected" : isPre ? "prerequisite of selection" : isPost ? "unlocked by selection" : "";
        return (
          <g
            key={c.id}
            data-id={c.id}
            transform={`translate(${p.x} ${p.y})`}
            className={`node${dim ? " dim" : ""}`}
            tabIndex={0}
            role="button"
            aria-pressed={isSel}
            aria-label={`${name}, ${GROVE_BY_ID.get(c.grove)!.name}, level ${c.level}${relText ? `, ${relText}` : ""}`}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onPick(c.id); } }}
          >
            <title>{name}</title>
            {isSel && <circle r={r + 12} className="halo-sel" />}
            {isPre && <><circle r={r + 8} className="halo-pre" /><circle r={r + 13} className="halo-pre" strokeWidth={2} /></>}
            {isPost && <circle r={r + 8} className="halo-post" />}
            <circle r={r} className="rim" />
            <circle r={r - 6} className="socket" />
            <use href={`#tree-${c.treeVariant}`} x={-(r - 6)} y={-(r - 4)} width={(r - 6) * 2} height={(r - 6) * 2} />
            <g transform={`translate(0 ${r + 14})`}>
              <rect x={-pw / 2} y={-10} width={pw} height={20} rx={5} className="plate" />
              <text textAnchor="middle" y={4} className="plate-text">{label}</text>
            </g>
            {isPre && <text textAnchor="middle" y={-r - 18} fontSize={16} fill="var(--bark-dark)" fontWeight={800}>▼ root</text>}
            {isPost && <text textAnchor="middle" y={-r - 16} fontSize={14} fill="var(--forest-deep)" fontWeight={800}>▲ branch</text>}
          </g>
        );
      })}
    </g>
  );
});

function Legend() {
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border-2 border-bark bg-cream/90 px-3 py-2 text-xs font-semibold text-ink shadow">
      <div className="flex items-center gap-2"><span className="inline-block h-1 w-6 rounded bg-amber" /> ▼ root — comes before</div>
      <div className="flex items-center gap-2"><span className="inline-block h-1 w-6 rounded border-t-2 border-dashed border-grass" /> ▲ branch — comes after</div>
      <div className="mt-1 text-muted-foreground">Drag · scroll to zoom · Space to re-centre</div>
    </div>
  );
}
