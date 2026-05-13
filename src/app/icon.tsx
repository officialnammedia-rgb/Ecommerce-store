import { ImageResponse } from "next/og";

// Next.js auto-uses `app/icon.tsx` as the site's favicon (32x32 by default).
// Rendering it dynamically means we don't need to ship a binary .ico and the
// icon always matches the current brand color — independent of any stale
// Vercel env vars or cached binary file.
export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#ffffff",
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: -1,
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        A
      </div>
    ),
    { ...size },
  );
}
