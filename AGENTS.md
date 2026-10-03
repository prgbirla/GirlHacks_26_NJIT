<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Concept graph data lives in src/lib/atlas/data.ts (single source); canvas, dossier and index all derive from it — keeps the map and tables consistent.
- Tree sprites are inline SVG data-URIs in src/lib/atlas/trees.ts — no external image dependencies.
- The forest map is a raw HTML canvas with its own camera loop; game paint colors live there, UI colors use design tokens.
