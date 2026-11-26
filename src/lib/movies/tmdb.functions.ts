import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { z } from "zod";
import { withCatalogArtwork } from './artwork';
import { movieCategory, movieGenres } from './categories';
import {
  catalogKey,
  cleanLugandaTitle,
  getFeaturedLugandaCatalog,
  getVjCatalog,
  listVjs,
  type LugandaMovie,
} from "./luganda-movies";

export type MediaKind = "movie" | "tv";
export type MediaCardData = {
  id: number;
  kind: MediaKind;
  title: string;
  poster: string | null;
  backdrop: string | null;
  year: string;
  rating: number;
  overview: string;
  lugandaVj?: string;
  thumbnail?: string | null;
};
export type MediaDetail = MediaCardData & {
  genres: string[];
  runtime: string;
  tagline: string;
  trailerKey: string | null;
  cast: { name: string; character: string; photo: string | null }[];
  similar: MediaCardData[];
};

import { localCard, localDetail, localCatalogPage, searchLocalCatalog, LOCAL_ID_START } from "./local-catalog";

const IMG = "https://image.tmdb.org/t/p/";

const tmdb = createServerOnlyFn(async (path: string, params: Record<string, string> = {}) => {
  const key = process.env["TMDB_API_KEY"];
  if (!key) throw new Error("Movie data key is missing");
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const headers: Record<string, string> = { accept: "application/json" };
  if (key.length > 40) headers["Authorization"] = `Bearer ${key}`;
  else url.searchParams.set("api_key", key);
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Movie data request failed (${res.status})`);
  return (await res.json()) as any;
});

function toCard(r: any, fallback?: MediaKind): MediaCardData | null {
  const kind: MediaKind = r.media_type === "tv" || r.media_type === "movie" ? r.media_type : (fallback ?? "movie");
  if (r.media_type === "person") return null;
  return {
    id: r.id,
    kind,
    title: r.title ?? r.name ?? "Untitled",
    poster: r.poster_path ? `${IMG}w342${r.poster_path}` : null,
    backdrop: r.backdrop_path ? `${IMG}w1280${r.backdrop_path}` : null,
    year: (r.release_date ?? r.first_air_date ?? "").slice(0, 4),
    rating: Math.round((r.vote_average ?? 0) * 10) / 10,
    overview: r.overview ?? "",
  };
}
const cards = (list: any[], k?: MediaKind) =>
  list.map((r) => toCard(r, k)).filter((x): x is MediaCardData => !!x).map(card => withCatalogArtwork(card));

const lugandaTmdbCache = new Map<string, MediaCardData | null>();

async function resolveOneLuganda(entry: LugandaMovie): Promise<MediaCardData | null> {
  const key = catalogKey(entry);
  if (lugandaTmdbCache.has(key)) {
    const cached = lugandaTmdbCache.get(key);
    return cached ? withCatalogArtwork({ ...cached, lugandaVj: entry.vj }, entry.thumbnail) : null;
  }
  const query = cleanLugandaTitle(entry.title);
  if (!query) return null;
  try {
    let res = await tmdb("/search/movie", {
      query,
      year: String(entry.year),
      include_adult: "false",
    });
    let hits: any[] = res.results ?? [];
    if (hits.length === 0) {
      res = await tmdb("/search/movie", { query, include_adult: "false" });
      hits = (res.results ?? []).filter((h: any) => {
        const y = Number.parseInt((h.release_date ?? "").slice(0, 4), 10);
        return !Number.isFinite(y) || Math.abs(y - entry.year) <= 2;
      });
    }
    const best =
      hits.find((h) => h.backdrop_path) ?? hits.find((h) => h.poster_path) ?? hits[0] ?? null;
    const card = best ? toCard(best, "movie") : localCard(entry);
    lugandaTmdbCache.set(key, card);
    return card ? withCatalogArtwork({ ...card, lugandaVj: entry.vj }, entry.thumbnail) : localCard(entry);
  } catch {
    return localCard(entry);
  }
}

async function resolveLugandaBatch(entries: LugandaMovie[]): Promise<MediaCardData[]> {
  const out: MediaCardData[] = [];
  const seenIds = new Set<number>();
  for (let i = 0; i < entries.length; i += 10) {
    const resolved = await Promise.all(entries.slice(i, i + 10).map(resolveOneLuganda));
    for (const card of resolved) {
      if (!card || seenIds.has(card.id)) continue;
      seenIds.add(card.id);
      out.push(card);
    }
  }
  return out;
}

export const getHome = createServerFn({ method: "GET" }).handler(async () => {
  const vjs = listVjs();
  const featuredEntries = getFeaturedLugandaCatalog(14);
  const usedKeys = new Set(featuredEntries.map(catalogKey));
  const topVjBatches = vjs.slice(0, 3).map((vj) => {
    const batch = getVjCatalog(vj.name, 0, 12, usedKeys).items;
    for (const item of batch) usedKeys.add(catalogKey(item));
    return { title: vj.name, entries: batch };
  });

  const lists: [string, Promise<any>, MediaKind | undefined][] = [
    ["Trending now", tmdb("/trending/all/week"), undefined],
    ["Popular movies", tmdb("/movie/popular"), "movie"],
    ["Now playing in cinemas", tmdb("/movie/now_playing"), "movie"],
    ["Coming soon", tmdb("/movie/upcoming"), "movie"],
    ["Top rated films", tmdb("/movie/top_rated"), "movie"],
    ["Popular series", tmdb("/tv/popular"), "tv"],
    ["Top rated series", tmdb("/tv/top_rated"), "tv"],
    ...movieGenres.map(([name, id]) => [name, tmdb("/discover/movie", { with_genres: String(id), sort_by: "popularity.desc" }), "movie"] as [string, Promise<any>, MediaKind]),
  ];
  const [lugandaItems, vjResolved, results] = await Promise.all([
    resolveLugandaBatch(featuredEntries),
    Promise.all(
      topVjBatches.map(async (b) => ({ title: b.title, items: await resolveLugandaBatch(b.entries) })),
    ),
    Promise.all(lists.map(([, p]) => p.catch(() => ({ results: [] })))),
  ]);
  const tmdbRows = lists
    .map(([title, , k], i) => ({ title, items: cards(results[i]?.results ?? [], k) }))
    .filter((r) => r.items.length);
  const rows = [
    ...(lugandaItems.length ? [{ title: "Luganda Translated", items: lugandaItems }] : []),
    ...vjResolved.filter((r) => r.items.length),
    ...tmdbRows,
  ];
  const trending = tmdbRows.find((r) => r.title === "Trending now")?.items ?? [];
  const hero = trending.find((m) => m.backdrop) ?? rows[0]?.items.find((m) => m.backdrop) ?? null;
  let heroTrailer: string | null = null;
  if (hero) {
    try {
      const v = await tmdb(`/${hero.kind}/${hero.id}/videos`);
      const vids: any[] = v.results ?? [];
      heroTrailer = (vids.find((x) => x.site === "YouTube" && x.type === "Trailer") ?? vids.find((x) => x.site === "YouTube"))?.key ?? null;
    } catch {}
  }
  return { hero, heroTrailer, rows, vjs };
});

export const getCategoryPage = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(100), page: z.number().int().min(1).max(500) }).parse(d))
  .handler(async ({ data }): Promise<{ items: MediaCardData[]; nextPage: number | null }> => {
    const category = movieCategory(data.slug);
    if (!category) throw new Error('This category is unavailable.');
    if (category.vj) {
      const result = getVjCatalog(category.vj, (data.page - 1) * 24, 24);
      return { items: await resolveLugandaBatch(result.items), nextPage: result.hasMore ? data.page + 1 : null };
    }
    if (!category.path) return { items: [], nextPage: null };
    try {
      const params: Record<string, string> = { page: String(data.page), include_adult: 'false' };
      if (category.genre) {
        params['with_genres'] = String(category.genre);
        params['sort_by'] = 'popularity.desc';
      }
      const result = await tmdb(category.path, params);
      const maxPage = Math.min(result.total_pages ?? 1, 500);
      return { items: cards(result.results ?? [], category.kind === 'mixed' ? undefined : category.kind), nextPage: data.page < maxPage ? data.page + 1 : null };
    } catch {
      // Do not substitute unrelated catalog films for a genre or TMDB list.
      return { items: [], nextPage: null };
    }
  });

export const getExplorePage = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ page: z.number().int().min(1).max(500) }).parse(d))
  .handler(async ({ data }) => {
    let r;
    try { r = await tmdb("/discover/movie", {
      sort_by: "popularity.desc",
      include_adult: "false",
      "vote_count.gte": "50",
      page: String(data.page),
    }); } catch { return localCatalogPage(data.page); }
    const maxPage = Math.min(r.total_pages ?? 1, 500);
    return {
      items: cards(r.results ?? [], "movie"),
      nextPage: data.page < maxPage ? data.page + 1 : null,
    };
  });

export const getVjMoviesPage = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        vj: z.string().min(1).max(60),
        offset: z.number().int().min(0),
        limit: z.number().int().min(1).max(24).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const limit = data.limit ?? 12;
    const { items: entries, hasMore, total } = getVjCatalog(data.vj, data.offset, limit);
    const items = await resolveLugandaBatch(entries);
    return {
      items,
      nextOffset: hasMore ? data.offset + limit : null,
      total,
    };
  });

export const searchMedia = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ q: z.string().max(100) }).parse(d))
  .handler(async ({ data }) => {
    if (!data.q.trim()) return [] as MediaCardData[];
    const local = searchLocalCatalog(data.q);
    try {
      const r = await tmdb("/search/multi", { query: data.q, include_adult: "false" });
      const remote = cards(r.results ?? []);
      const names = new Set(remote.map(m => `${m.title.toLowerCase()}-${m.year}`));
      return [...remote, ...local.filter(m => !names.has(`${m.title.toLowerCase()}-${m.year}`))];
    } catch { return local; }
  });

export const getDetail = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ kind: z.enum(["movie", "tv"]), id: z.number().int().positive() }).parse(d))
  .handler(async ({ data }): Promise<MediaDetail> => {
    if (data.kind === "movie" && data.id >= LOCAL_ID_START) return localDetail(data.id);
    const r = await tmdb(`/${data.kind}/${data.id}`, { append_to_response: "videos,credits,similar" });
    const base = toCard(r, data.kind);
    if (!base) throw new Error("This title is unavailable.");
    const vids: any[] = r.videos?.results ?? [];
    const trailer =
      vids.find((v) => v.site === "YouTube" && v.type === "Trailer" && v.official) ??
      vids.find((v) => v.site === "YouTube" && v.type === "Trailer") ??
      vids.find((v) => v.site === "YouTube");
    const mins = r.runtime ?? r.episode_run_time?.[0];
    return {
      ...withCatalogArtwork(base),
      genres: (r.genres ?? []).map((g: any) => g.name),
      runtime: data.kind === "tv" ? `${r.number_of_seasons ?? 0} seasons` : mins ? `${Math.floor(mins / 60)}h ${mins % 60}m` : "",
      tagline: r.tagline ?? "",
      trailerKey: trailer?.key ?? null,
      cast: (r.credits?.cast ?? []).slice(0, 12).map((c: any) => ({
        name: c.name,
        character: c.character ?? "",
        photo: c.profile_path ? `${IMG}w185${c.profile_path}` : null,
      })),
      similar: cards(r.similar?.results ?? [], data.kind).slice(0, 12),
    };
  });
