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

## Architecture rules
- All concept data lives in `src/data/concepts.ts`; map, search, dossier and index derive from it (unlocks/depth are computed, never hand-written) — single source of truth.
- Map camera is applied via direct SVG transform on a ref (not React state) so 200+ memoized nodes never re-render while panning.
