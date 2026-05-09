/**
 * Single source of truth for outward-facing site metadata. Read once on the
 * server (or once on the client where allowed via NEXT_PUBLIC_*) so we don't
 * drift between layout, sitemap, robots, OG image, and analytics.
 */

const FALLBACK_URL = "http://localhost:3000";

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

/** Public, absolute origin for the storefront, e.g. https://ascendyl.in */
export function siteUrl(): string {
  // Prefer the explicit storefront base; fall back to NextAuth's URL (which is
  // also the same origin in our setup) before localhost.
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.STORE_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    FALLBACK_URL;
  return trimTrailingSlash(fromEnv);
}

/** Display name shown to shoppers (header, OG, emails). */
export function siteName(): string {
  return (
    process.env.NEXT_PUBLIC_STORE_NAME ||
    process.env.STORE_NAME ||
    "Ascendyl"
  );
}

/** Default site-wide description used for OG/Twitter and CMS fallbacks. */
export const SITE_DESCRIPTION =
  "Modern, breathable everyday clothing for women and men. Designed in India, made to move with you. Shop new arrivals, bestsellers, and seasonal sale.";

/** Default keywords for the homepage / collection pages. */
export const SITE_KEYWORDS = [
  "Ascendyl",
  "online clothing store India",
  "women's clothing",
  "men's clothing",
  "dresses",
  "tops",
  "jeans",
  "t-shirts",
  "ethnic wear",
  "loungewear",
  "fashion India",
];

/** Returns the absolute URL for a path on this site. */
export function absoluteUrl(path: string = "/"): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl()}${p}`;
}
