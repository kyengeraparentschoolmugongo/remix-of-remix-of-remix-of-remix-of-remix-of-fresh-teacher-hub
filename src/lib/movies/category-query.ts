import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { getCategoryPage } from './tmdb.functions';

export const categoryQuery = (slug: string, page: number) => queryOptions({
  queryKey: ['freshflix-category', slug, page],
  queryFn: () => getCategoryPage({ data: { slug, page } }),
  staleTime: 600_000,
});

export const categoryInfiniteQuery = (slug: string) => infiniteQueryOptions({
  queryKey: ['freshflix-category-infinite', slug],
  queryFn: ({ pageParam }) => getCategoryPage({ data: { slug, page: pageParam } }),
  initialPageParam: 1,
  getNextPageParam: (last) => last.nextPage ?? undefined,
  staleTime: 600_000,
});
