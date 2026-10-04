import { useId, useMemo, useState } from "react";
import { GROVE_BY_ID } from "@/data/concepts";
import { displayName, searchConcepts } from "@/lib/forest";
import { TreeIcon } from "./TreeSymbols";

interface Props { onPick: (id: string) => void; placeholder?: string; large?: boolean; autoFocus?: boolean }

export function SearchBox({ onPick, placeholder = "Search the forest…", large, autoFocus }: Props) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const results = useMemo(() => searchConcepts(q, 8), [q]);
  const listId = useId();
  const closest = results.length > 0 && !results[0]!.exact;

  const pick = (id: string) => { onPick(id); setQ(""); setOpen(false); setActive(0); };

  return (
    <div className="relative w-full">
      <input
        type="search"
        value={q}
        autoFocus={autoFocus}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
          else if (e.key === "Enter" && results[active]) { e.preventDefault(); pick(results[active].concept.id); }
          else if (e.key === "Escape") setOpen(false);
        }}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label="Search concepts"
        className={`w-full rounded-xl border-2 border-bark bg-cream font-semibold text-ink placeholder:text-muted-foreground focus:outline-none focus-visible:ring-4 focus-visible:ring-amber/60 ${large ? "px-5 py-4 text-lg" : "px-3 py-1.5 text-sm"}`}
      />
      {open && q && (
        <div id={listId} role="listbox" className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border-2 border-bark bg-cream text-left shadow-xl">
          {closest && (
            <p className="border-b border-border bg-parchment-deep px-3 py-2 text-xs font-semibold text-bark-dark">
              No tree is named exactly “{q}”. These are the closest trees we could find in the forest.
            </p>
          )}
          {results.length === 0 && <p className="px-3 py-3 text-sm text-muted-foreground">Nothing grows by that name yet. Try “gradient” or “probability”.</p>}
          {results.map((r, i) => (
            <button
              key={r.concept.id}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); pick(r.concept.id); }}
              onMouseEnter={() => setActive(i)}
              className={`flex w-full items-center gap-3 px-3 py-2 text-left ${i === active ? "bg-parchment-deep" : ""}`}
            >
              <TreeIcon variant={r.concept.treeVariant} size={28} />
              <span className="flex-1">
                <span className="block text-sm font-bold text-ink">{displayName(r.concept)}</span>
                <span className="block text-xs text-muted-foreground">{GROVE_BY_ID.get(r.concept.grove)!.name} · {r.reason}</span>
              </span>
              {i === 0 && <kbd className="rounded border border-border px-1.5 text-[10px] text-muted-foreground">Enter</kbd>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
