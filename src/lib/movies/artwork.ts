import { findLugandaStreams } from './luganda-movies';
import type { MediaCardData } from './tmdb.functions';

export function withCatalogArtwork<T extends MediaCardData>(card: T, thumbnail?: string | null): T {
  const fallback = thumbnail ?? (card.kind === 'movie'
    ? findLugandaStreams(card.title, card.year).find(entry => entry.thumbnail)?.thumbnail
    : null) ?? null;
  return { ...card, poster: card.poster ?? fallback, backdrop: card.backdrop ?? fallback, thumbnail: fallback };
}

export function artworkCandidates(card: MediaCardData, landscape: boolean): string[] {
  return [...new Set((landscape ? [card.backdrop, card.poster, card.thumbnail] : [card.poster, card.thumbnail])
    .filter((url): url is string => Boolean(url)))];
}