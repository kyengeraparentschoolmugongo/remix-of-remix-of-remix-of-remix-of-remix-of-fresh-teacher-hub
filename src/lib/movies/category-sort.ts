import type { MediaCardData } from './tmdb.functions';

export const SORT_OPTIONS = [
  { value: 'default', label: 'Recommended' },
  { value: 'az', label: 'Title A–Z' },
  { value: 'za', label: 'Title Z–A' },
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'rating', label: 'Highest rated' },
] as const;

export const TYPE_OPTIONS = [
  { value: '', label: 'Movies & series' },
  { value: 'movie', label: 'Movies' },
  { value: 'tv', label: 'Series' },
] as const;

const yearNum = (y: string) => Number.parseInt(y, 10) || 0;

export function sortAndFilterItems(
  items: MediaCardData[],
  opts: { sort?: string; type?: string; year?: string },
  cleanTitle: (t: string) => string = t => t,
): MediaCardData[] {
  let out = items;
  if (opts.type === 'movie' || opts.type === 'tv') out = out.filter(i => i.kind === opts.type);
  if (opts.year) out = out.filter(i => i.year === opts.year);
  const title = (i: MediaCardData) => cleanTitle(i.title).toLowerCase();
  switch (opts.sort) {
    case 'az': return [...out].sort((a, b) => title(a).localeCompare(title(b)));
    case 'za': return [...out].sort((a, b) => title(b).localeCompare(title(a)));
    case 'newest': return [...out].sort((a, b) => yearNum(b.year) - yearNum(a.year));
    case 'oldest': return [...out].sort((a, b) => yearNum(a.year) - yearNum(b.year));
    case 'rating': return [...out].sort((a, b) => b.rating - a.rating);
    default: return out;
  }
}
