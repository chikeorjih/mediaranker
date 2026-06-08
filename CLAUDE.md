# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build (also type-checks)
npm run start    # Serve production build
npm run lint     # ESLint via next lint
npx tsc --noEmit # Type-check without building
```

There are no tests. The dev server hot-reloads on save.

## Architecture

**Stack:** Next.js 14 App Router · TypeScript · Tailwind CSS · Supabase (PostgreSQL) · Deployed on Vercel

**Database:** Supabase (hosted PostgreSQL). The client lives in `db/index.ts` which exports all query helpers. All DB functions are `async`. The Supabase client uses a `global._supabase` singleton to survive Next.js hot-reload. `persistSession: false` is required so Supabase doesn't try to access browser storage on the server.

**Two database tables:**
- `media_items` — title, TMDB metadata, `elo_rating` (REAL, default 1000), `comparison_count`. Unique constraint on `(tmdb_id, type)`.
- `comparisons` — append-only log of `(winner_id, loser_id)` pairs.

**Elo system (`lib/elo.ts`):** Pure functions, no side effects. K-factor is 32 for items with fewer than 10 comparisons, 16 thereafter. `calculateEloUpdate()` is the main entry point.

**TMDB integration (`lib/tmdb.ts`):** All TMDB calls are proxied through `/api/search` so the API key stays server-side. TV shows use `name`/`first_air_date` fields; movies use `title`/`release_date`. `lib/tmdb.ts` normalizes both into the same `TmdbSearchResult` shape before returning. Only `poster_path` (the relative path) is stored in the DB; the full URL is constructed at render time via `posterUrl()`.

**Page/component boundary pattern:** Hub pages (`app/[type]/page.tsx`) are async Server Components that call the DB directly and pass plain data down. Interactive parts are split into small `"use client"` files alongside the page — e.g. `HubClient.tsx` owns the search modal state, `RankingsList.tsx` owns the delete interaction. After a mutation the hub reloads via `window.location.reload()` to re-run the server component and get fresh rankings.

**Compare flow:** `app/compare/[type]/page.tsx` is a thin Server Component wrapper; `components/CompareScreen.tsx` is a full client component that owns the fetch-vote-fetch loop. It calls `GET /api/compare` for a pair, then `POST /api/compare` with the winner, then fetches again — no page navigation between rounds.

## Environment variables

```
TMDB_API_KEY=...              # From themoviedb.org/settings/api
SUPABASE_URL=...              # From supabase.com → Project Settings → API
SUPABASE_SERVICE_ROLE_KEY=... # Service role key (server-side only, never expose to client)
```

## Key gotchas

- **TMDB field names differ by type** — movies: `title` + `release_date`; TV: `name` + `first_air_date`. Normalization happens in `lib/tmdb.ts`, not in the API route.
- **Supabase unique constraint error code** — duplicate inserts throw with `error.code === '23505'` (PostgreSQL), not a string message like SQLite did.
- **`export const runtime = "nodejs"`** is set on every API route to ensure they never accidentally run on the Edge runtime.
- **`export const dynamic = "force-dynamic"`** is set on `app/[type]/page.tsx` so the rankings page always fetches fresh data rather than being statically cached.
- **TMDB poster images require `remotePatterns`** for `image.tmdb.org` in `next.config.js` — removing it causes Next.js `<Image>` to 400 every poster.
