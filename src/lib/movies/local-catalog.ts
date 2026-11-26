import rawMovies from '@/data/luganda-movies.json';
import { catalogKey, cleanLugandaTitle, getVjCatalog, type LugandaMovie } from './luganda-movies';
import type { MediaCardData, MediaDetail } from './tmdb.functions';

// Catalog IDs stay stable because the supplied catalog order is preserved.
export const LOCAL_ID_START = 1_000_000_000;
const entries = rawMovies as LugandaMovie[];
const ids = new Map<string, number>();
entries.forEach((entry, index) => {
  const key = catalogKey(entry);
  if (!ids.has(key)) ids.set(key, LOCAL_ID_START + index);
});

export function localCard(entry: LugandaMovie): MediaCardData {
  return {
    id: ids.get(catalogKey(entry)) ?? LOCAL_ID_START,
    kind: 'movie', title: cleanLugandaTitle(entry.title), year: String(entry.year),
    poster: entry.thumbnail ?? null, backdrop: entry.thumbnail ?? null,
    thumbnail: entry.thumbnail ?? null, rating: 0, overview: '', lugandaVj: entry.vj,
  };
}

export function localDetail(id: number): MediaDetail {
  const entry = entries[id - LOCAL_ID_START];
  if (!entry) throw new Error('This movie is unavailable.');
  return { ...localCard(entry), genres: [], runtime: '', tagline: '', trailerKey: null,
    cast: [], similar: getVjCatalog(entry.vj, 0, 12).items.map(localCard).filter(m => m.id !== id) };
}

export function localCatalogPage(page: number) {
  const offset = (page - 1) * 20;
  const result = getVjCatalog('all', offset, 20);
  return { items: result.items.map(localCard), nextPage: result.hasMore ? page + 1 : null };
}

export function searchLocalCatalog(query: string): MediaCardData[] {
  const words = query.toLowerCase().trim().split(/\s+/);
  const seen = new Set<string>();
  return entries.filter(entry => {
    const text = `${cleanLugandaTitle(entry.title)} ${entry.year} ${entry.vj}`.toLowerCase();
    const key = catalogKey(entry);
    if (!words.every(word => text.includes(word)) || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 100).map(localCard);
}