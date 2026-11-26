export function isLegacyMoviePath(path: string): boolean {
  const normalized = path.replace(/^\/+|\/+$/g, '').toLowerCase();
  return normalized === 'movie.html' || normalized === 'featured.html' ||
    normalized === 'movie-site' || normalized.startsWith('movie-site/');
}