import { describe, expect, it } from 'vitest';
import { isLegacyMoviePath } from '@/lib/movie-redirects';
import { localCard, localDetail, searchLocalCatalog } from '@/lib/movies/local-catalog';
import { getVjCatalog, findLugandaStreams } from '@/lib/movies/luganda-movies';

describe('integrated movie catalog', () => {
  it.each(['movie.html', 'featured.html', 'Movie-Site/series.html', '/Movie-Site/'])('recognizes legacy movie link %s', path => {
    expect(isLegacyMoviePath(path)).toBe(true);
  });
  it('does not redirect academic pages', () => {
    expect(isLegacyMoviePath('p1.html')).toBe(false);
  });
  it('opens a catalog title with its original playable stream and searchable title', () => {
    const entry = getVjCatalog('all', 0, 1).items[0];
    if (!entry) throw new Error('The supplied catalog is empty');
    const card = localCard(entry);
    const detail = localDetail(card.id);
    expect(detail.title).toBe(card.title);
    expect(searchLocalCatalog(detail.title).some(m => m.id === card.id)).toBe(true);
    expect(findLugandaStreams(detail.title, detail.year).map(m => m.href)).toContain(entry.href);
  });
});