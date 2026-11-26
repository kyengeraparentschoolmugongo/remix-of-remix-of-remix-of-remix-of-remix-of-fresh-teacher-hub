import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import catalog from '@/data/luganda-movies.json';
import { artworkCandidates, withCatalogArtwork } from '@/lib/movies/artwork';
import { localCard, localDetail, LOCAL_ID_START } from '@/lib/movies/local-catalog';
import { getLugandaBadgeLabel, getVjCatalog, findLugandaStreams } from '@/lib/movies/luganda-movies';
import { useMovieArtwork } from '@/components/movies/useMovieArtwork';

afterEach(cleanup);

function sample() {
  const entry = catalog[0];
  if (!entry) throw new Error('Catalog is empty');
  return localCard(entry);
}

describe('translated artwork', () => {
  it('keeps the original first movie ID, stream, and Wikipedia thumbnail', () => {
    const card = sample();
    expect(card.id).toBe(LOCAL_ID_START);
    expect(card.thumbnail).toContain('upload.wikimedia.org/');
    expect(localDetail(card.id).title).toBe('Dr. Dolittle 2');
    expect(findLugandaStreams(card.title, card.year)[0]?.href).toBe('https://mobifliks.info/downloadmp4.php?file=luganda/Dr.%20Dolittle%202%20by%20Vj%20Emmy%20-%20Mobifliks.com.mp4');
  });

  it('loads the five Luo titles with original streams and Wikipedia artwork', () => {
    const entries = getVjCatalog('Luo Translated', 0, 100).items;
    expect(entries).toHaveLength(5);
    expect(entries.map(entry => localCard(entry).title).sort()).toEqual(['Ben-Hur', 'Peter Rabbit', 'Rat Race', 'Shadow in the Cloud', 'Tomb Raider']);
    for (const entry of entries) {
      const card = localCard(entry);
      expect(entry.href).toContain('file=luo/');
      expect(card.thumbnail).toContain('upload.wikimedia.org/');
      expect(getLugandaBadgeLabel(card.title, card.year, card.lugandaVj)).toBe('Luo Translated');
      expect(findLugandaStreams(card.title, card.year)).toContainEqual(entry);
    }
  });

  it('uses Wikipedia when TMDB artwork is null', () => {
    const card = sample();
    const enriched = withCatalogArtwork({ ...card, poster: null, backdrop: null });
    expect(enriched.poster).toBe(card.thumbnail);
    expect(enriched.backdrop).toBe(card.thumbnail);
    expect(artworkCandidates(enriched, false)).toEqual([card.thumbnail]);
  });

  it('prefers TMDB then Wikipedia for posters and landscapes', () => {
    const card = withCatalogArtwork({ ...sample(), poster: 'https://image.tmdb.org/poster.jpg', backdrop: 'https://image.tmdb.org/backdrop.jpg' });
    expect(artworkCandidates(card, false)).toEqual([card.poster, card.thumbnail]);
    expect(artworkCandidates(card, true)).toEqual([card.backdrop, card.poster, card.thumbnail]);
  });

  it.each([false, true])('advances past failed artwork and removes exhausted images (landscape=%s)', landscape => {
    const card = withCatalogArtwork({ ...sample(), poster: 'https://image.tmdb.org/poster.jpg', backdrop: 'https://image.tmdb.org/backdrop.jpg' });
    const { result } = renderHook(() => useMovieArtwork(card, landscape));
    for (const candidate of artworkCandidates(card, landscape)) {
      expect(result.current.src).toBe(candidate);
      act(() => result.current.onError());
    }
    expect(result.current.src).toBeNull();
    expect(result.current.loaded).toBe(false);
  });

  it('marks a successfully loaded fallback ready for display', () => {
    const card = sample();
    const { result } = renderHook(() => useMovieArtwork(card, false));
    expect(result.current.loaded).toBe(false);
    act(() => result.current.onLoad());
    expect(result.current.loaded).toBe(true);
    expect(result.current.src).toBe(card.thumbnail);
  });
});