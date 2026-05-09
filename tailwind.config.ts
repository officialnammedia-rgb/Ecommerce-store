import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    container: {
      center: true,
      // Responsive horizontal padding so content doesn't hug the screen edge
      // on small phones (was a flat 16px previously, which felt cramped on
      // checkout and product cards).
      padding: {
        DEFAULT: "1.25rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        brand: {
          DEFAULT: "#111111",
          foreground: "#ffffff",
          muted: "#6b7280",
          accent: "#e11d48",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
