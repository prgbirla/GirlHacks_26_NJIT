import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { CONCEPT_BY_ID, GROVES, type GroveId } from "@/data/concepts";
import { ForestMap, type ForestMapHandle } from "@/components/forest/ForestMap";
import { Dossier } from "@/components/forest/Dossier";
import { SearchBox } from "@/components/forest/SearchBox";
import { Welcome } from "@/components/forest/Welcome";
import { CurriculumIndex } from "@/components/forest/CurriculumIndex";
import { TreeSymbols } from "@/components/forest/TreeSymbols";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Knowledge Forest — A visual atlas of mathematics" },
      { name: "description", content: "Explore 200+ math concepts as a living forest, from algebra roots to the optimization canopy. See what comes before and after every idea." },
      { property: "og:title", content: "Knowledge Forest — A visual atlas of mathematics" },
      { property: "og:description", content: "Trace any math concept back to its roots and forward to where it leads." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [view, setView] = useState<"welcome" | "atlas">("welcome");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [grove, setGrove] = useState<"all" | GroveId>("all");
  const [indexOpen, setIndexOpen] = useState(false);
  const map = useRef<ForestMapHandle>(null);
  const pending = useRef<(() => void) | null>(null);

  const select = useCallback((id: string) => {
    setSelectedId(id);
    map.current?.focusConcept(id);
  }, []);

  const enter = (fn: () => void) => { pending.current = fn; setView("atlas"); };
  useEffect(() => {
    if (view === "atlas" && pending.current) {
      const fn = pending.current; pending.current = null;
      setTimeout(fn, 60);
    }
  }, [view]);

  const pickGrove = (g: "all" | GroveId) => {
    setGrove(g);
    if (g === "all") map.current?.wholeTree(); else map.current?.focusGrove(g);
  };

  useEffect(() => {
    if (view !== "atlas") return;
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, button, [role=button], [role=dialog]")) return;
      if (e.code === "Space") { e.preventDefault(); if (selectedId) map.current?.focusConcept(selectedId); else map.current?.wholeTree(); }
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [view, selectedId]);

  const concept = selectedId ? CONCEPT_BY_ID.get(selectedId) ?? null : null;

  return (
    <>
      <TreeSymbols />
      {view === "welcome" ? (
        <Welcome
          onPick={(id) => enter(() => select(id))}
          onGrove={(g) => enter(() => pickGrove(g))}
          onBegin={() => enter(() => select("functions"))}
        />
      ) : (
        <div className="flex h-screen flex-col">
          <header className="wood-plank z-20 flex flex-wrap items-center gap-2 px-3 py-2 md:gap-3 md:px-4">
            <button onClick={() => { setView("welcome"); setSelectedId(null); }} className="font-display text-xl font-bold text-cream md:text-2xl" aria-label="Knowledge Forest — return to welcome screen">
              Knowledge Forest
            </button>
            <div className="order-last w-full md:order-none md:ml-4 md:w-72">
              <SearchBox onPick={select} />
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="grove-select">Grove</label>
              <select id="grove-select" value={grove} onChange={(e) => pickGrove(e.target.value as "all" | GroveId)}
                className="rounded-lg border-2 border-bark-dark bg-cream px-2 py-1.5 text-sm font-bold text-ink">
                <option value="all">All Groves</option>
                {GROVES.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <button className="btn-forest" onClick={() => selectedId ? map.current?.focusConcept(selectedId) : map.current?.wholeTree()} title="Space">◎ Center Focus</button>
              <button className="btn-forest" onClick={() => { setGrove("all"); map.current?.wholeTree(); }}>Whole Tree</button>
              <button className="btn-forest" onClick={() => setIndexOpen(true)}>Curriculum Index</button>
            </div>
          </header>
          <div className="flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[65%_35%]">
            <div className="h-[55vh] min-h-0 md:h-auto">
              <ForestMap ref={map} selectedId={selectedId} onSelect={select} />
            </div>
            <aside aria-label="Concept dossier" className="min-h-0 flex-1 overflow-y-auto border-t-4 border-bark parchment-panel md:border-l-4 md:border-t-0">
              <Dossier concept={concept} onPick={select} />
            </aside>
          </div>
          <CurriculumIndex open={indexOpen} onClose={() => setIndexOpen(false)} onPick={select} />
        </div>
      )}
    </>
  );
}
