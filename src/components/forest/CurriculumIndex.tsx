import { useEffect, useRef } from "react";
import { CONCEPTS, GROVES } from "@/data/concepts";
import { TreeIcon } from "./TreeSymbols";

export function CurriculumIndex({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    ref.current?.focus();
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-deep/60 p-4" onClick={onClose}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Curriculum index"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-5xl animate-scale-in overflow-y-auto rounded-2xl border-4 border-bark parchment-panel p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-bark-dark">Curriculum Index</h2>
          <button onClick={onClose} className="btn-forest" aria-label="Close index">Close ✕</button>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">Every grove, from its roots upward. {CONCEPTS.length} trees in all.</p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {GROVES.map((g) => (
            <section key={g.id}>
              <h3 className="mb-2 flex items-center gap-2 border-b-2 border-bark pb-1 text-lg font-bold text-forest-deep">
                <TreeIcon variant={g.tree} size={28} /> {g.name}
              </h3>
              <ol className="space-y-0.5">
                {CONCEPTS.filter((c) => c.grove === g.id).sort((a, b) => a.depth - b.depth).map((c) => (
                  <li key={c.id}>
                    <button onClick={() => { onPick(c.id); onClose(); }} className="w-full rounded px-1 text-left text-sm text-ink hover:bg-parchment-deep">
                      {c.name} <span className="text-xs text-muted-foreground">· L{c.level}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
