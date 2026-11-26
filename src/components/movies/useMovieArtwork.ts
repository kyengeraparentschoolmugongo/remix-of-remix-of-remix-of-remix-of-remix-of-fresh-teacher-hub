import { useEffect, useRef, useState } from 'react';
import { artworkCandidates } from '@/lib/movies/artwork';
import type { MediaCardData } from '@/lib/movies/tmdb.functions';

export function useMovieArtwork(card: MediaCardData, landscape: boolean) {
  const candidates = artworkCandidates(card, landscape);
  const [failed, setFailed] = useState<string[]>([]);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const src = candidates.find(url => !failed.includes(url)) ?? null;
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) setLoadedUrl(src);
  }, [src]);
  return { src, imgRef, loaded: src !== null && loadedUrl === src,
    onLoad: () => setLoadedUrl(src),
    onError: () => { if (src) setFailed(previous => [...previous, src]); } };
}