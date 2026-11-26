import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Play, Star } from "lucide-react";
import { homeQuery } from "@/lib/movies/home-query";
import { featuredSlides, uniqueRows } from "@/lib/movies/media-browsing";
import { LandscapeRow } from "@/components/movies/LandscapeCard";
import { ExploreMoreGrid, VjFilterBar, VjMoviesGrid } from "@/components/movies/HomeInfiniteGrid";
import { AdSenseBanner } from "@/components/movies/AdSenseBanner";

export const Route = createFileRoute("/movies/")({
  staticData: { sitemap: false },
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  head: ({ loaderData }) => ({
    meta: [
      { title: "FRESHFLIX — Discover movies and TV shows" },
      {
        name: "description",
        content:
          "Browse trending movies and series, watch trailers and stream Luganda translated films.",
      },
      { property: "og:title", content: "FRESHFLIX — Discover movies and TV shows" },
      {
        property: "og:description",
        content:
          "Browse trending movies and series, watch trailers and stream Luganda translated films.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/movies" },
      { name: "twitter:card", content: "summary_large_image" },
      ...(loaderData?.hero?.backdrop
        ? [
            { property: "og:image", content: loaderData.hero.backdrop },
            { name: "twitter:image", content: loaderData.hero.backdrop },
          ]
        : []),
    ],
    links: [{ rel: "canonical", href: "/movies" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "FRESHFLIX",
          potentialAction: {
            "@type": "SearchAction",
            target: "/movies/search?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
    ],
  }),
  component: Home,
  errorComponent: ({ error }) => (
    <div className="p-24 text-center text-muted-foreground">
      {error instanceof Error ? error.message : "Something went wrong"}
    </div>
  ),
  notFoundComponent: () => <div className="px-5 pb-20 pt-28 text-foreground">Movies are unavailable.</div>,
});

function Home() {
  const { data } = useSuspenseQuery(homeQuery);
  const heroes = useMemo(() => featuredSlides(data.rows), [data.rows]);
  const rows = useMemo(() => uniqueRows(data.rows, heroes), [data.rows, heroes]);
  const baseLugandaRow = rows.find((r) => r.title === "Luganda Translated");
  // Shuffle after mount (not during SSR) so each visit shows a fresh order without hydration mismatches.
  const [shuffleSeed, setShuffleSeed] = useState(0);
  useEffect(() => setShuffleSeed(Math.random() || 0.5), []);
  const lugandaRow = useMemo(() => {
    if (!baseLugandaRow || !shuffleSeed) return baseLugandaRow;
    const items = [...baseLugandaRow.items];
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j]!, items[i]!];
    }
    return { ...baseLugandaRow, items };
  }, [baseLugandaRow, shuffleSeed]);
  const otherRows = rows.filter((r) => r.title !== "Luganda Translated");
  const displayed = useMemo(
    () => [...heroes, ...rows.flatMap((r) => r.items)],
    [heroes, rows],
  );
  const [selectedVj, setSelectedVj] = useState<string | null>(null);
  const activeVjSummary = data.vjs.find((v) => v.name === selectedVj);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: heroes.length > 1 });

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduceMotion(query.matches);
    updatePreference();
    query.addEventListener("change", updatePreference);
    return () => query.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (!emblaApi || hovered || focused || interacting || reduceMotion || heroes.length < 2) return;
    const timer = window.setInterval(() => emblaApi.scrollNext(), 7000);
    return () => window.clearInterval(timer);
  }, [emblaApi, focused, heroes.length, hovered, interacting, reduceMotion]);

  return (
    <div className="pb-20 pt-20">
      {heroes.length > 0 && (
        <section
          aria-label="Featured movies and series"
          aria-roledescription="carousel"
          className="relative"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => {
            setHovered(false);
            setInteracting(false);
          }}
          onFocusCapture={() => setFocused(true)}
          onBlurCapture={(event) => {
            if (!event.relatedTarget || !event.currentTarget.contains(event.relatedTarget as Node))
              setFocused(false);
          }}
          onPointerDownCapture={() => setInteracting(true)}
          onPointerUpCapture={() => setInteracting(false)}
          onPointerCancelCapture={() => setInteracting(false)}
        >
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {heroes.map((hero, index) => {
                const Title = index === selectedIndex ? "h1" : "p";
                return (
                  <div
                    key={`${hero.kind}-${hero.id}`}
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${index + 1} of ${heroes.length}: ${hero.title}`}
                    aria-hidden={index !== selectedIndex}
                    className="relative min-h-[calc(85svh-4rem)] min-w-0 flex-[0_0_100%]"
                  >
                    <img
                      src={hero.backdrop ?? ""}
                      alt=""
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="hero-fade absolute inset-0" />
                    <div className="relative flex min-h-[calc(85svh-4rem)] max-w-2xl flex-col justify-end px-5 pb-20 pt-6 sm:px-10 sm:pb-24 sm:pt-10">
                      <p className="text-xs font-semibold uppercase text-primary">
                        Trending this week
                      </p>
                      <Title className="mt-3 break-words font-display text-3xl leading-tight text-foreground sm:text-7xl">
                        {hero.title}
                      </Title>
                      <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        {hero.rating} · {hero.year}
                      </p>
                      <p className="mt-3 line-clamp-2 text-foreground/85 sm:mt-4 sm:line-clamp-3">{hero.overview}</p>
                      <div className="mt-5 sm:mt-6">
                        {hero.kind === "tv" ? (
                          <Link
                            to="/movies/tv/$id"
                            params={{ id: String(hero.id) }}
                            tabIndex={index === selectedIndex ? 0 : -1}
                            className="btn-primary"
                            aria-label={`Watch ${hero.title}`}
                          >
                            <Play className="h-4 w-4 fill-current" />
                            Watch
                          </Link>
                        ) : (
                          <Link
                            to="/movies/movie/$id"
                            params={{ id: String(hero.id) }}
                            tabIndex={index === selectedIndex ? 0 : -1}
                            className="btn-primary"
                            aria-label={`Watch ${hero.title}`}
                          >
                            <Play className="h-4 w-4 fill-current" />
                            Watch
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {heroes.length > 1 && (
            <>
              <div className="absolute bottom-5 right-4 flex gap-2 sm:bottom-16 sm:right-10">
                <button
                  type="button"
                  aria-label="Previous featured title"
                  onClick={() => emblaApi?.scrollPrev()}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/60 text-foreground backdrop-blur transition-colors hover:bg-secondary"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next featured title"
                  onClick={() => emblaApi?.scrollNext()}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/60 text-foreground backdrop-blur transition-colors hover:bg-secondary"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <div
                className="absolute bottom-9 left-5 flex items-center gap-2 sm:bottom-7 sm:left-1/2 sm:-translate-x-1/2"
                aria-label="Choose a featured title"
              >
                {heroes.map((hero, index) => (
                  <button
                    key={`${hero.kind}-${hero.id}`}
                    type="button"
                    aria-label={`Go to ${hero.title}`}
                    aria-current={index === selectedIndex ? "true" : undefined}
                    onClick={() => emblaApi?.scrollTo(index)}
                    className={`h-2 rounded-full transition-all ${index === selectedIndex ? "w-8 bg-primary" : "w-2 bg-foreground/40 hover:bg-foreground/70"}`}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      )}
      {lugandaRow && <LandscapeRow title={lugandaRow.title} items={lugandaRow.items} />}
      <VjFilterBar vjs={data.vjs} selected={selectedVj} onSelect={setSelectedVj} />
      {selectedVj && activeVjSummary ? (
        <VjMoviesGrid key={selectedVj} vj={selectedVj} count={activeVjSummary.count} />
      ) : (
        <>
          {otherRows.slice(0, 1).map((row) => (
            <LandscapeRow key={row.title} title={row.title} items={row.items} />
          ))}
          <AdSenseBanner slot="catalogListing" className="mx-auto max-w-7xl px-5 sm:px-10" />
          {otherRows.slice(1).map((row) => (
            <LandscapeRow key={row.title} title={row.title} items={row.items} />
          ))}
          <ExploreMoreGrid displayed={displayed} />
        </>
      )}
    </div>
  );
}
