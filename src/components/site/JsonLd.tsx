import { siteName, siteUrl } from "@/lib/site";

/**
 * Server-rendered JSON-LD structured data. Drop these into a route to give
 * Google/Bing/etc. machine-readable hints about what the page is about. They
 * meaningfully improve rich-result eligibility (sitelinks, product cards,
 * breadcrumbs in SERP, etc.).
 */

function tag(json: unknown) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

/** Organization + WebSite — emitted on the homepage only. */
export function OrgJsonLd() {
  const NAME = siteName();
  const URL = siteUrl();
  const phone = process.env.SUPPORT_PHONE;
  const email = process.env.SUPPORT_EMAIL;
  return (
    <>
      {tag({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: NAME,
        url: URL,
        logo: `${URL}/opengraph-image`,
        ...(phone || email
          ? {
              contactPoint: [
                {
                  "@type": "ContactPoint",
                  contactType: "customer support",
                  ...(phone ? { telephone: phone } : {}),
                  ...(email ? { email } : {}),
                  areaServed: "IN",
                  availableLanguage: ["en", "hi"],
                },
              ],
            }
          : {}),
      })}
      {tag({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: NAME,
        url: URL,
        potentialAction: {
          "@type": "SearchAction",
          target: `${URL}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      })}
    </>
  );
}

/** Product schema — emitted on product detail pages. */
export function ProductJsonLd({
  title,
  description,
  slug,
  image,
  price,
  compareAtPrice,
  inStock,
  sku,
  brand,
}: {
  title: string;
  description?: string | null;
  slug: string;
  image?: string | null;
  /** price in paise (smallest INR unit) */
  price: number;
  /** original "list" price in paise, if discounted */
  compareAtPrice?: number | null;
  inStock: boolean;
  sku?: string | null;
  brand?: string;
}) {
  const URL = siteUrl();
  const NAME = brand ?? siteName();
  const priceRupees = (price / 100).toFixed(2);
  return tag({
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    ...(description ? { description } : {}),
    ...(image ? { image: [image] } : {}),
    ...(sku ? { sku } : {}),
    brand: { "@type": "Brand", name: NAME },
    offers: {
      "@type": "Offer",
      url: `${URL}/products/${slug}`,
      priceCurrency: "INR",
      price: priceRupees,
      ...(compareAtPrice && compareAtPrice > price
        ? { priceValidUntil: undefined }
        : {}),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  });
}

/** Breadcrumb schema — emit on product/collection/CMS pages for SERP crumbs. */
export function BreadcrumbJsonLd({
  items,
}: {
  items: Array<{ name: string; href: string }>;
}) {
  const URL = siteUrl();
  return tag({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.href.startsWith("http") ? item.href : `${URL}${item.href}`,
    })),
  });
}
