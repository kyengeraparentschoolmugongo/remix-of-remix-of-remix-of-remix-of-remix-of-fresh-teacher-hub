import { describe, expect, it } from 'vitest';
import { sortAndFilterItems } from '@/lib/movies/category-sort';
import { cleanLugandaTitle } from '@/lib/movies/luganda-movies';
import type { MediaCardData } from '@/lib/movies/tmdb.functions';

const card = (id: number, title: string, year: string, kind: 'movie' | 'tv' = 'movie'): MediaCardData =>
  ({ id, kind, title, year, rating: id, overview: '', poster: null, backdrop: null } as MediaCardData);
const items = [card(1, 'Zorro', '2001'), card(2, 'Avatar', '2009'), card(3, 'Madagascar', '2005', 'tv')];

describe('category sorting', () => {
  it('sorts alphabetically', () => expect(sortAndFilterItems(items, { sort: 'az' }).map(i => i.title)).toEqual(['Avatar', 'Madagascar', 'Zorro']));
  it('sorts newest first', () => expect(sortAndFilterItems(items, { sort: 'newest' }).map(i => i.year)).toEqual(['2009', '2005', '2001']));
  it('filters by year', () => expect(sortAndFilterItems(items, { year: '2005' }).map(i => i.id)).toEqual([3]));
  it('filters by type', () => expect(sortAndFilterItems(items, { type: 'movie' }).map(i => i.id)).toEqual([1, 2]));
  it('strips VJ names from titles', () => {
    expect(cleanLugandaTitle('Black Panther by Ice P')).toBe('Black Panther');
    expect(cleanLugandaTitle('Land Shark Ice P')).toBe('Land Shark');
    expect(cleanLugandaTitle('Tom and Jerry The Magic Ring (2001 - VJ Kevo - Luganda)')).toBe('Tom and Jerry The Magic Ring');
  });
});
