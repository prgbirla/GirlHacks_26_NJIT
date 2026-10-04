import { CONCEPTS, CONCEPT_BY_ID, GROVES, type Concept, type GroveId } from "@/data/concepts";

export const LANE_ORDER: GroveId[] = ["trig", "geo", "alg", "calc", "opt", "lin", "stat", "prob", "disc"];
export const NODE_R = 36;
export const radiusOf = (c: Concept) => (c.level === 1 ? NODE_R : NODE_R * 0.8);

const COL = 124;
const ROW = 160;
const LANE_PAD = 70;

export interface Lane { grove: GroveId; x0: number; x1: number; bannerY: number; topY: number }
export interface Layout {
  pos: Map<string, { x: number; y: number }>;
  lanes: Lane[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

function computeLayout(): Layout {
  const pos = new Map<string, { x: number; y: number }>();
  const lanes: Lane[] = [];
  const maxDepth = Math.max(...CONCEPTS.map((c) => c.depth));
  // rows per lane
  const rows = new Map<GroveId, Concept[][]>();
  for (const g of LANE_ORDER) rows.set(g, Array.from({ length: maxDepth + 1 }, () => []));
  for (const c of CONCEPTS) rows.get(c.grove)![c.depth]!.push(c);

  let x = 0;
  const laneCenter = new Map<GroveId, number>();
  for (const g of LANE_ORDER) {
    const widest = Math.max(...rows.get(g)!.map((r) => r.length));
    const w = widest * COL + LANE_PAD * 2;
    const depths = CONCEPTS.filter((c) => c.grove === g).map((c) => c.depth);
    lanes.push({
      grove: g, x0: x, x1: x + w,
      bannerY: -Math.min(...depths) * ROW + 110,
      topY: -Math.max(...depths) * ROW - 90,
    });
    laneCenter.set(g, x + w / 2);
    x += w;
  }
  for (let d = 0; d <= maxDepth; d++) {
    for (const g of LANE_ORDER) {
      const row = rows.get(g)![d]!;
      const cx = laneCenter.get(g)!;
      const bary = (c: Concept) => {
        const ps = c.prerequisites.map((p) => pos.get(p)?.x).filter((v): v is number => v !== undefined);
        return ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : cx;
      };
      row.sort((a, b) => bary(a) - bary(b));
      row.forEach((c, i) => {
        const stagger = row.length === 1 ? 0 : (i % 2 ? 18 : -18);
        pos.set(c.id, { x: cx + (i - (row.length - 1) / 2) * COL, y: -d * ROW + stagger });
      });
    }
  }
  return {
    pos, lanes,
    bounds: { minX: -40, minY: -maxDepth * ROW - 200, maxX: x + 40, maxY: 260 },
  };
}

export const LAYOUT = computeLayout();

export function ancestorsOf(id: string): Set<string> {
  const out = new Set<string>();
  const walk = (i: string) => { for (const p of CONCEPT_BY_ID.get(i)!.prerequisites) if (!out.has(p)) { out.add(p); walk(p); } };
  walk(id);
  return out;
}
export function descendantsOf(id: string): Set<string> {
  const out = new Set<string>();
  const walk = (i: string) => { for (const u of CONCEPT_BY_ID.get(i)!.unlocks) if (!out.has(u)) { out.add(u); walk(u); } };
  walk(id);
  return out;
}

/** Longest chain of prerequisites back to a root, for the breadcrumb trail. */
export function trailFromRoots(id: string): Concept[] {
  const chain: Concept[] = [];
  let cur = CONCEPT_BY_ID.get(id);
  while (cur) {
    chain.unshift(cur);
    const next: Concept | undefined = cur.prerequisites
      .map((p) => CONCEPT_BY_ID.get(p)!)
      .sort((a, b) => b.depth - a.depth)[0];
    cur = next;
  }
  return chain;
}

export const groveName = (g: GroveId) => GROVES.find((x) => x.id === g)!.name;
export const displayName = (c: Concept) => {
  const dup = CONCEPTS.some((o) => o.id !== c.id && o.name === c.name);
  return dup ? `${c.name} (${groveName(c.grove)})` : c.name;
};

export interface SearchResult { concept: Concept; score: number; exact: boolean; reason: string }

export function searchConcepts(q: string, limit = 8): SearchResult[] {
  const query = q.trim().toLowerCase();
  if (!query) return [];
  const words = query.split(/\s+/);
  const singular = query.replace(/s$/, "");
  const out: SearchResult[] = [];
  for (const c of CONCEPTS) {
    const name = c.name.toLowerCase();
    const grove = groveName(c.grove).toLowerCase();
    let score = 0; let exact = false; let reason = "";
    if (name === query || name === singular) { score = 1000; exact = true; reason = "name"; }
    else if (name.startsWith(query) || name.startsWith(singular)) { score = 800 - name.length; exact = true; reason = "name"; }
    else if (name.split(/[\s-]+/).some((w) => w.startsWith(singular))) { score = 600 - name.length; exact = true; reason = "name"; }
    else if (c.aliases.some((a) => a.includes(query) || a.includes(singular))) { score = 500; exact = true; reason = "alias"; }
    else if (grove.includes(query)) { score = 400 - c.depth; exact = true; reason = `grove: ${groveName(c.grove)}`; }
    else {
      const app = c.applications.find((a) => words.every((w) => a.toLowerCase().includes(w)));
      if (app) { score = 300; reason = `used in ${app.split(" — ")[0]}`; }
      else if (c.formula.toLowerCase().includes(query)) { score = 250; reason = "notation"; }
      else if (words.every((w) => c.description.toLowerCase().includes(w))) { score = 200; reason = "lore"; }
    }
    if (score) out.push({ concept: c, score, exact, reason });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}
