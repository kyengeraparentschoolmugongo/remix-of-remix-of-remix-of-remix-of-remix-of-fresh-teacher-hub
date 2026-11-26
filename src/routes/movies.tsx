import { useEffect, useState } from "react";
import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { Navbar } from "@/components/movies/Navbar";
import { THEME_KEY } from "@/components/movies/ThemeToggle";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/movies")({
  staticData: { sitemap: false },
  head: () => ({
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Manrope:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: MovieLayout,
});

function MovieLayout() {
  const loading = useRouterState({ select: (state) => state.isLoading });
  const [dark, setDark] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem(THEME_KEY) === "light") setDark(false);
    } catch {
      // storage may be blocked
    }
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      // storage may be blocked
    }
  };

  return (
    <div className={`freshflix-shell${dark ? "" : " freshflix-light"}`}>
      {loading && <div className="freshflix-route-progress" role="progressbar" aria-label="Loading page" />}
      <Navbar dark={dark} onToggleTheme={toggleTheme} />
      <main>
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}