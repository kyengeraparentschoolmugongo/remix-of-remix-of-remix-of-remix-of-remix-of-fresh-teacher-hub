import { describe, expect, it } from 'vitest';
import { categorySlug, movieCategory, movieGenres } from '@/lib/movies/categories';
import { getVjCatalog, listVjs } from '@/lib/movies/luganda-movies';

describe('movie category destinations', () => {
  it.each([
    ['Trending now', '/trending/all/week'], ['Popular movies', '/movie/popular'],
    ['Now playing in cinemas', '/movie/now_playing'], ['Coming soon', '/movie/upcoming'],
    ['Top rated films', '/movie/top_rated'], ['Popular series', '/tv/popular'],
    ['Top rated series', '/tv/top_rated'],
  ])('keeps %s in its own list', (title, path) => {
    expect(movieCategory(categorySlug(title))?.path).toBe(path);
  });
  it.each(movieGenres)('keeps %s filtered by its genre', (title, id) => {
    expect(movieCategory(categorySlug(title))?.genre).toBe(id);
  });
  it('opens the complete translated catalog, not only the featured shelf', () => {
    const category = movieCategory(categorySlug('Luganda Translated'));
    expect(category?.vj).toBe('all');
    expect(getVjCatalog(category?.vj ?? '', 0, 24).total).toBeGreaterThan(24);
  });
  it('keeps VJ categories isolated and browsable beyond their first page', () => {
    const vj = listVjs()[0];
    if (!vj) throw new Error('Expected a bundled VJ catalog');
    const category = movieCategory(categorySlug(vj.name));
    expect(category?.vj).toBe(vj.name);
    const first = getVjCatalog(category?.vj ?? '', 0, 24);
    const next = getVjCatalog(category?.vj ?? '', 24, 24);
    expect(first.hasMore).toBe(true);
    expect(next.items.length).toBeGreaterThan(0);
    expect([...first.items, ...next.items].every(item => item.vj === vj.name)).toBe(true);
    expect(next.items.some(item => first.items.some(previous => previous.href === item.href))).toBe(false);
  });
  it('maps detail-page headings to the original categories', () => {
    expect(categorySlug('More Luganda Translated')).toBe('luganda-translated');
    expect(categorySlug('Trending this week')).toBe('trending-now');
  });
  it('rejects unknown categories instead of showing unrelated movies', () => {
    expect(movieCategory('not-a-category')).toBeUndefined();
  });
});