import { ImageResponse } from "next/og";
import { siteName, SITE_DESCRIPTION } from "@/lib/site";

// Generated 1200x630 OpenGraph card used as the default share preview for
// pages that don't override their own openGraph.images. Keeps the brand
// consistent on Slack, WhatsApp, Twitter/X, etc.
export const runtime = "edge";
export const alt = "Ascendyl — Modern everyday clothing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const name = siteName();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "linear-gradient(135deg, #fafafa 0%, #ffffff 60%, #f5e9da 100%)",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          color: "#0a0a0a",
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#737373",
          }}
        >
          {name.toUpperCase()}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 88,
              fontWeight: 600,
              lineHeight: 1.05,
              maxWidth: 980,
            }}
          >
            Modern everyday clothing.
          </div>
          <div
            style={{
              fontSize: 32,
              color: "#404040",
              maxWidth: 980,
              lineHeight: 1.3,
            }}
          >
            {SITE_DESCRIPTION}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: "#525252",
          }}
        >
          <div>Designed in India · Free shipping over ₹2,000</div>
          <div style={{ fontWeight: 600, color: "#0a0a0a" }}>Shop now →</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
