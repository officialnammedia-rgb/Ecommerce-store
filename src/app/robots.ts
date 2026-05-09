import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep crawlers out of authenticated, transactional, and admin paths.
        disallow: [
          "/admin",
          "/api",
          "/account",
          "/cart",
          "/checkout",
          "/auth",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
