import { useMovieArtwork } from './useMovieArtwork';
import { Link } from "@tanstack/react-router";
import { ChevronRight, Film } from "lucide-react";
import type { MediaCardData } from "@/lib/movies/tmdb.functions";
import { cleanLugandaTitle, getLugandaBadgeLabel, slugifyVj } from "@/lib/movies/luganda-movies";
import { ThumbnailVjBadge } from "@/components/movies/TranslatedLabel";
import { categorySlug, movieCategory } from '@/lib/movies/categories';

export function LandscapeCard({ m, grid = false }: { m: MediaCardData; grid?: boolean }) {
  const { src, loaded, imgRef, onLoad, onError } = useMovieArtwork(m, true);
  const badge = m.kind === "movie" ? getLugandaBadgeLabel(m.title, m.year, m.lugandaVj) : null;
  const title = badge ? cleanLugandaTitle(m.title) : m.title;
  const inner = (
    <>
      <div className={`poster-frame relative aspect-video ${src && !loaded ? "img-shimmer" : ""}`}>
        {src ? (
          <img ref={imgRef} src={src} alt={m.title} loading="lazy" onLoad={onLoad} onError={onError} className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center">
            <Film className="h-6 w-6 text-muted-foreground" />
            <span className="line-clamp-2 text-sm font-semibold text-foreground">{title}</span>
          </div>
        )}
        <ThumbnailVjBadge label={badge} />
      </div>
      <p className={`mt-2 px-0.5 text-sm font-semibold text-foreground ${grid ? "line-clamp-2" : "truncate"}`}>{title}</p>
    </>
  );
  const cls = grid ? "group block min-w-0 w-full" : "landscape-card group block shrink-0 sm:w-72";
  return m.kind === "tv" ? (
    <Link to="/movies/tv/$id" params={{ id: String(m.id) }} className={cls}>{inner}</Link>
  ) : (
    <Link
      to="/movies/movie/$id"
      params={{ id: String(m.id) }}
      search={m.lugandaVj ? { vj: slugifyVj(m.lugandaVj) } : {}}
      className={cls}
    >
      {inner}
    </Link>
  );
}

export function LandscapeRow({ title, items }: { title: string; items: MediaCardData[] }) {
  if (!items.length) return null;
  const category = movieCategory(categorySlug(title));
  return (
    <section className="mt-8">
      <h2 className="mb-3 px-4 font-display text-xl text-foreground sm:px-10">
        {category ? (
          <Link to="/movies/category/$category" params={{ category: category.slug }} className="inline-flex max-w-full items-center gap-1 rounded-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="min-w-0 break-words">{title}</span><ChevronRight className="h-5 w-5 shrink-0 text-primary" />
          </Link>
        ) : title}
      </h2>
      <div className="landscape-row no-scrollbar flex gap-4 overflow-x-auto px-4 pb-2 sm:gap-3 sm:px-10">
        {items.map((m) => <LandscapeCard key={`${m.kind}-${m.id}`} m={m} />)}
      </div>
    </section>
  );
}
