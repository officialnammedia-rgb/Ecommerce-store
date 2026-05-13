import { ImageResponse } from "next/og";

// 180x180 apple-touch-icon so iOS/Safari shelves the site with a branded
// Ascendyl tile when a user saves it to their home screen.
export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 120,
          fontWeight: 700,
          letterSpacing: -6,
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          borderRadius: 36,
        }}
      >
        A
      </div>
    ),
    { ...size },
  );
}
