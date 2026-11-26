<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Imported application architecture
- Mount the shared bottom navigation in both section shells and reuse the existing install card and chat state through a supplied trigger; this keeps help and installation behavior consistent without coupling section themes.
- Isolate FreshFlix routes under `/movies` and its modules under movie-specific directories; scoped theme variables prevent movie styles and query keys from changing the library.
- Resolve movie shelf links and paginated category requests through the shared movie category registry; this keeps genre, list, and VJ destinations consistent and prevents unrelated fallback results.
- Keep category pagination in validated URL search state and prime page-specific movie query caches in loaders; this preserves reload and browser-history behavior without mixing category results.
- Preserve bundled movie IDs and external streaming providers, with local catalog fallbacks when TMDB is unavailable; missing credentials must not make the supplied catalog disappear.
- Enrich existing translated catalog rows by stream URL and append new streams only; shared artwork helpers prefer TMDB and retain catalog thumbnails for missing or failed images without changing saved local IDs.
- Use the offline artwork merger with exact stream precedence and unambiguous title/year fallback; this keeps enrichment repeatable and avoids artwork from remakes.
- Keep document link verification and page-item baking in offline Python helpers; this restores import checks without adding remote probes to library browsing.
- Serve favicon files locally and derive launcher icons from the same selected artwork; maskable icons must preserve the artwork inside the safe zone so platform cropping cannot remove it.
- Keep the target TanStack bootstrap and pinned framework versions while importing compatible application modules, so hosting stays supported.
- Resolve the public resource library from the bundled catalog and legacy manifests; retain existing CDN media and document providers because the source has no account database.
- Render fixed document-page shells directly in JSX rather than parsing captured HTML at runtime, preserving existing wrapper classes so styling stays unchanged.

## External GitHub Pages sync
- Keep production-owned publishing tooling and workflows byte-for-byte during app sync, merging only the publishing commands into the incoming package manifest; this prevents source imports from breaking static deployment.
- Validate sync preservation with `scripts/sync_from_lovable.py` and its Python regression tests before pushing a review branch; deployment stays a separate manual action so importing code cannot replace the live website.
