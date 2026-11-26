import { Link } from "@tanstack/react-router";
import { useMovieArtwork } from './useMovieArtwork';
import type { MediaCardData } from "@/lib/movies/tmdb.functions";
import { cleanLugandaTitle, getLugandaBadgeLabel, slugifyVj } from "@/lib/movies/luganda-movies";
import { ThumbnailVjBadge, TranslatedLabel } from "@/components/movies/TranslatedLabel";

export function MediaCard({ m }: { m: MediaCardData }) {
  const { src, loaded, imgRef, onLoad, onError } = useMovieArtwork(m, false);
  const badge = m.kind === "movie" ? getLugandaBadgeLabel(m.title, m.year, m.lugandaVj) : null;
  const title = badge ? cleanLugandaTitle(m.title) : m.title;
  const inner = (
    <>
      <div className={`poster-frame relative aspect-[2/3] ${src && !loaded ? "img-shimmer" : ""}`}>
        {src ? <img ref={imgRef} src={src} alt={m.title} loading="lazy" onLoad={onLoad} onError={onError} className={`h-full w-full object-cover transition-all duration-500 ${loaded ? "opacity-100" : "opacity-0"}`} /> : <div className="flex h-full items-center justify-center p-3 text-center text-sm text-muted-foreground">{title}</div>}
        <span className="absolute left-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary backdrop-blur">{m.kind === "tv" ? "Series" : "Film"}</span>
      </div>
      <p className="mt-2 truncate px-0.5 text-sm font-semibold text-foreground">{m.title}</p>
      <TranslatedLabel label={badge} />
    </>
  );
  return m.kind === "tv" ? (
    <Link to="/movies/tv/$id" params={{ id: String(m.id) }} className="group block w-36 shrink-0 sm:w-44">{inner}</Link>
  ) : (
    <Link
      to="/movies/movie/$id"
      params={{ id: String(m.id) }}
      search={m.lugandaVj ? { vj: slugifyVj(m.lugandaVj) } : {}}
      className="group block w-36 shrink-0 sm:w-44"
    >
      {inner}
    </Link>
  );
}

export function Row({ title, items }: { title: string; items: MediaCardData[] }) {
  if (!items.length) return null;
  return (
    <section className="mt-10">
      <h2 className="mb-4 px-5 font-display text-xl text-foreground sm:px-10">{title}</h2>
      <div className="no-scrollbar flex gap-4 overflow-x-auto px-5 pb-2 sm:px-10">
        {items.map((m) => <MediaCard key={`${m.kind}-${m.id}`} m={m} />)}
      </div>
    </section>
  );
}
