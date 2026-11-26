import { describe, expect, it } from 'vitest';
import { shouldLoadAdsense } from '../lib/adsense';

describe('production ads', () => {
  it('loads ads on the production site without any cookie choice', () => {
    expect(shouldLoadAdsense(true, 'fresh-teacher.github.io')).toBe(true);
  });
  it('does not request ads on previews', () => {
    expect(shouldLoadAdsense(true, 'localhost')).toBe(false);
    expect(shouldLoadAdsense(true, '127.0.0.1')).toBe(false);
    expect(shouldLoadAdsense(true, 'id-preview--6bdc6ddb-8108-44ae-884b-1df3b78a33d4.lovable.app')).toBe(false);
    expect(shouldLoadAdsense(true, 'fresh-teacher.github.io.example.com')).toBe(false);
    expect(shouldLoadAdsense(false, 'fresh-teacher.github.io')).toBe(false);
  });
});

describe('ad pages', () => {
  it('allows ads on document pages and FreshFlix catalog, search, and detail pages', async () => {
    const { isAdPage } = await import('../lib/adsense');
    expect(isAdPage('/doc/p7-maths-2024')).toBe(true);
    expect(isAdPage('/movies')).toBe(true);
    expect(isAdPage('/movies/search')).toBe(true);
    expect(isAdPage('/movies/movie/736790')).toBe(true);
    expect(isAdPage('/movies/tv/1396')).toBe(true);
    expect(isAdPage('/')).toBe(false);
    expect(isAdPage('/p7.html')).toBe(false);
    expect(isAdPage('/primary/p7')).toBe(false);
    expect(isAdPage('/search')).toBe(false);
    expect(isAdPage('/movies/privacy')).toBe(false);
    expect(isAdPage('/movies/terms')).toBe(false);
    expect(isAdPage('/movies/dmca')).toBe(false);
  });
});
