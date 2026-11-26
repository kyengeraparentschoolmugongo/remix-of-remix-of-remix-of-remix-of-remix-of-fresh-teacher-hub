import { useEffect, useRef } from "react";
import tracking from "@/data/site-tracking.json";
import { ensureAdsenseScript, isAdPage } from "@/lib/adsense";
import { requestAdOnce, shouldRequestManualAd } from "@/lib/manual-ads";
import { resolveAdSenseSlot, type AdSenseSlotKey } from "@/lib/movies/adsense";

type AdWindow = Window & { adsbygoogle?: { push: (value: Record<string, never>) => unknown } };

export function AdSenseBanner({
  slot,
  className,
  hostname,
}: {
  slot: AdSenseSlotKey | string;
  className?: string | undefined;
  hostname?: string | undefined;
}) {
  const slotId = resolveAdSenseSlot(slot);
  const insRef = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    const node = insRef.current;
    if (!node) return;
    const enabled = import.meta.env["VITE_ENABLE_ADSENSE"] === "true";
    const activeHost = hostname ?? window.location.hostname;
    if (!shouldRequestManualAd(enabled, activeHost, slotId, window.location.pathname)) return;

    const script = ensureAdsenseScript();
    const request = () => {
      if (!isAdPage(window.location.pathname)) return;
      const scriptEl = document.getElementById("ft-adsense") as HTMLScriptElement | null;
      if (!scriptEl || !node.isConnected || node.getBoundingClientRect().width === 0) return;
      requestAdOnce(node, () => {
        const adWindow = window as AdWindow;
        const queue = adWindow.adsbygoogle ?? ([] as Record<string, never>[]);
        adWindow.adsbygoogle = queue;
        queue.push({});
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) request();
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    const onLoad = () => {
      const bounds = node.getBoundingClientRect();
      if (bounds.bottom >= -200 && bounds.top <= window.innerHeight + 200) request();
    };
    script.addEventListener("load", onLoad);
    return () => {
      observer.disconnect();
      script.removeEventListener("load", onLoad);
    };
  }, [slotId, hostname]);

  return (
    <aside
      aria-label="Advertisement"
      className={`my-8 w-full ${className ?? ""}`}
    >
      <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Advertisement
      </p>
      <div className="flex min-h-[280px] w-full items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-card/40 sm:min-h-[250px]">
        <ins
          ref={insRef}
          className="adsbygoogle block w-full"
          data-ad-client={tracking.adsensePublisher}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
}