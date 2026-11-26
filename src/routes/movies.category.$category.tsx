import { createFileRoute, Link, notFound, useNavigate, useRouter } from '@tanstack/react-router';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandscapeCard } from '@/components/movies/LandscapeCard';
import { movieCategory, movieGenres } from '@/lib/movies/categories';
import { slugifyVj } from '@/lib/movies/luganda-movies';
import { cleanLugandaTitle } from '@/lib/movies/luganda-movies';
import { categoryInfiniteQuery } from '@/lib/movies/category-query';
import { sortAndFilterItems, SORT_OPTIONS, TYPE_OPTIONS } from '@/lib/movies/category-sort';

export const Route = createFileRoute('/movies/category/$category')({
  staticData: { sitemap: false },
  validateSearch: (search: Record<string, unknown>): { sort?: string; type?: string; year?: string } => {
    const out: { sort?: string; type?: string; year?: string } = {};
    if (typeof search['sort'] === 'string') out.sort = search['sort'];
    if (typeof search['type'] === 'string') out.type = search['type'];
    if (search['year'] !== undefined && search['year'] !== '') out.year = String(search['year']);
    return out;
  },
  loader: ({ context, params }) => {
    if (!movieCategory(params.category)) throw notFound();
    return context.queryClient.ensureInfiniteQueryData(categoryInfiniteQuery(params.category));
  },
  head: ({ params }) => {
    const category = movieCategory(params.category);
    const title = category ? `${category.title} — FRESHFLIX` : 'Category unavailable — FRESHFLIX';
    const description = category ? `Browse ${category.title} on FRESHFLIX, including all available titles and more pages of movies and series.` : 'This movie category is unavailable.';
    return { meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      ...(!category ? [{ name: 'robots', content: 'noindex, follow' }] : []),
    ] };
  },
  component: CategoryPage,
  errorComponent: CategoryError,
  notFoundComponent: () => (
    <div className="px-5 pb-20 pt-28 sm:px-10">
      <h1 className="font-display text-3xl text-foreground">Category unavailable</h1>
      <Button asChild variant="link" className="mt-6"><Link to="/movies"><ArrowLeft />Back to movies</Link></Button>
    </div>
  ),
  pendingComponent: () => (
    <div className="px-5 pb-20 pt-28 sm:px-10" role="status" aria-label="Loading category">
      <div className="img-shimmer mb-8 h-10 w-56 rounded" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }, (_, i) => <div key={i} className="poster-frame img-shimmer aspect-video" />)}
      </div>
    </div>
  ),
});

function CategoryError() {
  const router = useRouter();
  return (
    <div className="px-5 pb-20 pt-28 sm:px-10" role="alert">
      <h1 className="font-display text-3xl text-foreground">Movies could not be loaded</h1>
      <Button className="mt-6" onClick={() => void router.invalidate()}><RotateCw />Try again</Button>
      <Button asChild variant="link" className="ml-2 mt-6"><Link to="/movies">Back to movies</Link></Button>
    </div>
  );
}

function CategoryPage() {
  const { category: slug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const category = movieCategory(slug);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useSuspenseInfiniteQuery(categoryInfiniteQuery(slug));
  const all = useMemo(() => {
    const seen = new Set<string>();
    return data.pages.flatMap(p => p.items).filter(i => { const k = `${i.kind}-${i.id}`; if (seen.has(k)) return false; seen.add(k); return true; });
  }, [data]);
  const years = useMemo(() => [...new Set(all.map(i => i.year).filter(y => /^\d{4}$/.test(y)))].sort((a, b) => b.localeCompare(a)), [all]);
  const items = useMemo(() => sortAndFilterItems(all, search, cleanLugandaTitle), [all, search]);
  const sentinel = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return;
    const obs = new IntersectionObserver(e => { if (e.some(x => x.isIntersecting) && !isFetchingNextPage) void fetchNextPage(); }, { rootMargin: '800px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, items.length]);
  const set = (key: 'sort' | 'type' | 'year', value: string) =>
    void navigate({ search: prev => { const next = { ...prev }; if (value) next[key] = value; else delete next[key]; return next; }, replace: true, resetScroll: false });
  const selectCls = 'h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
  return (
    <div className="mx-auto max-w-screen-2xl px-5 pb-20 pt-24 sm:px-10 sm:pt-28">
      <Button asChild variant="link" className="mb-5 px-0"><Link to="/movies"><ArrowLeft />Back to movies</Link></Button>
      <h1 className="mb-5 min-w-0 break-words font-display text-3xl text-foreground sm:text-4xl">{category?.title}</h1>
      <div className="mb-8 flex flex-wrap items-center gap-3" aria-label="Sort and filter">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">Sort by
          <select className={selectCls} value={search.sort ?? 'default'} onChange={e => set('sort', e.target.value === 'default' ? '' : e.target.value)}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">Year
          <select className={selectCls} value={search.year ?? ''} onChange={e => set('year', e.target.value)}>
            <option value="">All years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        {category?.kind === 'mixed' && (
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">Type
            <select className={selectCls} value={search.type ?? ''} onChange={e => set('type', e.target.value)}>
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">Genre
          <select className={selectCls} value={category?.genre ? slug : ''} onChange={e => { if (e.target.value) void navigate({ to: '/movies/category/$category', params: { category: e.target.value }, search: { ...(search.sort ? { sort: search.sort } : {}) } }); }}>
            <option value="">All genres</option>
            {movieGenres.map(([title]) => <option key={title} value={slugifyVj(title)}>{title}</option>)}
          </select>
        </label>
        <span className="ml-auto self-end text-sm text-muted-foreground">{items.length} titles</span>
      </div>
      {items.length ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
          {items.map(item => <LandscapeCard key={`${item.kind}-${item.id}`} m={item} grid />)}
          {isFetchingNextPage && Array.from({ length: 4 }, (_, i) => <div key={`s${i}`} className="poster-frame img-shimmer aspect-video" />)}
        </div>
      ) : <p className="py-10 text-muted-foreground">{hasNextPage ? 'Loading more titles…' : 'No titles match these filters.'}</p>}
      <div ref={sentinel} className="h-10" aria-hidden="true" />
      {!hasNextPage && items.length > 0 && <p className="mt-6 text-center text-sm text-muted-foreground">You have reached the end.</p>}
    </div>
  );
}
