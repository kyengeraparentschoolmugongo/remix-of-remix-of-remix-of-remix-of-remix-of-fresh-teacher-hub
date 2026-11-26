import { listVjs, slugifyVj } from './luganda-movies';

export const movieGenres: [string, number][] = [
  ['Action Movies', 28], ['Comedy Movies', 35], ['Sci-Fi Movies', 878], ['Horror Movies', 27],
  ['Romance Movies', 10749], ['Animation', 16], ['Thrillers', 53], ['Crime Movies', 80],
  ['Adventure', 12], ['Documentaries', 99], ['Family Movies', 10751], ['Fantasy', 14],
];

export type MovieCategory = {
  slug: string;
  title: string;
  kind: 'movie' | 'tv' | 'mixed';
  path?: string;
  genre?: number;
  vj?: string;
};

const lists: MovieCategory[] = [
  { slug: 'trending-now', title: 'Trending now', kind: 'mixed', path: '/trending/all/week' },
  { slug: 'popular-movies', title: 'Popular movies', kind: 'movie', path: '/movie/popular' },
  { slug: 'now-playing-in-cinemas', title: 'Now playing in cinemas', kind: 'movie', path: '/movie/now_playing' },
  { slug: 'coming-soon', title: 'Coming soon', kind: 'movie', path: '/movie/upcoming' },
  { slug: 'top-rated-films', title: 'Top rated films', kind: 'movie', path: '/movie/top_rated' },
  { slug: 'popular-series', title: 'Popular series', kind: 'tv', path: '/tv/popular' },
  { slug: 'top-rated-series', title: 'Top rated series', kind: 'tv', path: '/tv/top_rated' },
  { slug: 'luganda-translated', title: 'Luganda Translated', kind: 'movie', vj: 'all' },
  ...movieGenres.map(([title, genre]): MovieCategory => ({ slug: slugifyVj(title), title, kind: 'movie', path: '/discover/movie', genre })),
];

export function movieCategory(slug: string): MovieCategory | undefined {
  const fixed = lists.find(category => category.slug === slug);
  if (fixed) return fixed;
  const vj = listVjs().find(item => slugifyVj(item.name) === slug);
  return vj ? { slug, title: vj.name, kind: 'movie', vj: vj.name } : undefined;
}

export function categorySlug(title: string): string {
  const aliases: Record<string, string> = {
    'More Luganda Translated': 'luganda-translated',
    'Trending this week': 'trending-now',
  };
  return aliases[title] ?? slugifyVj(title);
}