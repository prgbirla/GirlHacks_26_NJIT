import { CONCEPT_BY_ID, GROVE_BY_ID, type Concept } from "@/data/concepts";
import { displayName, trailFromRoots } from "@/lib/forest";
import { Medallion, TreeIcon } from "./TreeSymbols";

function ConceptCard({ c, onPick, kind }: { c: Concept; onPick: (id: string) => void; kind: "root" | "branch" }) {
  return (
    <button
      onClick={() => onPick(c.id)}
      className={`flex w-full items-center gap-3 rounded-lg border-2 bg-cream px-3 py-2 text-left transition hover:-translate-y-0.5 ${kind === "root" ? "border-amber" : "border-dashed border-grass"}`}
    >
      <TreeIcon variant={c.treeVariant} size={34} />
      <span className="flex-1">
        <span className="block text-sm font-bold text-ink">{displayName(c)}</span>
        <span className="block text-xs text-muted-foreground">{GROVE_BY_ID.get(c.grove)!.name} · {kind === "root" ? "▼ comes before" : "▲ comes after"}</span>
      </span>
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-bark">
        <span className="h-px flex-1 bg-border" />{title}<span className="h-px flex-1 bg-border" />
      </h3>
      {children}
    </section>
  );
}

export function Dossier({ concept, onPick }: { concept: Concept | null; onPick: (id: string) => void }) {
  if (!concept) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <Medallion variant="oak" size={120} />
        <h2 className="mt-4 text-2xl font-bold text-bark-dark">The dossier awaits</h2>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">Choose any tree in the forest to read its lore, trace its roots, and see where its branches lead.</p>
      </div>
    );
  }
  const grove = GROVE_BY_ID.get(concept.grove)!;
  const pre = concept.prerequisites.map((p) => CONCEPT_BY_ID.get(p)!);
  const post = concept.unlocks.map((p) => CONCEPT_BY_ID.get(p)!);
  const trail = trailFromRoots(concept.id);

  return (
    <article key={concept.id} className="animate-fade-in p-5 md:p-6" aria-live="polite">
      <header className="flex flex-col items-center text-center">
        <Medallion variant={concept.treeVariant} size={132} />
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-forest">{grove.name} Grove · {grove.tree} · level {concept.level}</p>
        <h2 className="mt-1 text-3xl font-bold leading-tight text-bark-dark">{concept.name}</h2>
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs font-bold">
          <span className="rounded-full border-2 border-amber bg-cream px-3 py-1 text-bark-dark">▼ rests on {pre.length} {pre.length === 1 ? "idea" : "ideas"}</span>
          <span className="rounded-full border-2 border-dashed border-grass bg-cream px-3 py-1 text-forest-deep">▲ opens the way to {post.length}</span>
        </div>
      </header>

      <Section title="Concept Lore">
        <p className="text-[15px] leading-relaxed text-ink">{concept.description}</p>
        <p className="mt-2 text-sm italic leading-relaxed text-muted-foreground">{concept.intuition}</p>
      </Section>

      <Section title="Formal Formulation">
        <figure className="rounded-lg border-2 border-bark-dark bg-terminal p-4 shadow-inner">
          <code className="block whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-terminal-foreground" aria-label={`Formula for ${concept.name}: ${concept.formula}`}>
            {concept.formula}
          </code>
        </figure>
      </Section>

      <Section title="Trail from the Roots">
        <nav aria-label="Prerequisite trail" className="flex flex-wrap items-center gap-1 text-sm">
          <span className="font-bold text-bark">{GROVE_BY_ID.get(trail[0]!.grove)!.name}</span>
          {trail.map((t) => (
            <span key={t.id} className="flex items-center gap-1">
              <span className="text-muted-foreground" aria-hidden>→</span>
              {t.id === concept.id
                ? <span className="rounded bg-gold/40 px-1.5 font-bold text-bark-dark">{t.name}</span>
                : <button onClick={() => onPick(t.id)} className="font-semibold text-forest underline decoration-dotted underline-offset-4 hover:text-forest-deep">{t.name}</button>}
            </span>
          ))}
        </nav>
      </Section>

      <Section title="Foundational Roots">
        {pre.length ? <div className="grid gap-2">{pre.map((c) => <ConceptCard key={c.id} c={c} onPick={onPick} kind="root" />)}</div>
          : <p className="text-sm text-muted-foreground">This is a root of the forest — it needs nothing before it.</p>}
      </Section>

      <Section title="Future Learning Horizons">
        {post.length ? <div className="grid gap-2">{post.map((c) => <ConceptCard key={c.id} c={c} onPick={onPick} kind="branch" />)}</div>
          : <p className="text-sm text-muted-foreground">A canopy tip. From here the mathematics flowers into the real world below.</p>}
      </Section>

      <Section title="Real-World Field Horizons">
        <ul className="grid gap-2">
          {concept.applications.map((a) => {
            const [field, rest] = a.split(" — ");
            return (
              <li key={a} className="rounded-lg border border-border bg-cream/70 px-3 py-2 text-sm">
                <span className="font-bold text-bark-dark">{field}</span>{rest && <span className="text-muted-foreground"> — {rest}</span>}
              </li>
            );
          })}
        </ul>
      </Section>
    </article>
  );
}
