import tracking from "@/data/site-tracking.json";
import units from "@/data/ad-units.json";
import { ensureAdsenseScript, shouldLoadAdsense } from "@/lib/adsense";

export const ADSENSE_PUBLISHER_ID = tracking.adsensePublisher;
export const ADSENSE_SCRIPT_URL = tracking.adsenseScript;

export const ADSENSE_SLOTS = {
  primaryContent: units.document,
  catalogListing: units.catalog,
} as const;

export type AdSenseSlotKey = keyof typeof ADSENSE_SLOTS;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function isProductionAdDomain(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/:\d+$/, "");
  return shouldLoadAdsense(true, host);
}

export function resolveAdSenseSlot(slot: AdSenseSlotKey | string): string {
  if (slot in ADSENSE_SLOTS) {
    return ADSENSE_SLOTS[slot as AdSenseSlotKey];
  }
  return slot;
}

export function ensureAdSenseScript(hostname?: string): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  const activeHost = hostname ?? window.location.hostname;
  const enabled = import.meta.env["VITE_ENABLE_ADSENSE"] === "true";
  if (!shouldLoadAdsense(enabled, activeHost)) return false;
  ensureAdsenseScript();
  return true;
}