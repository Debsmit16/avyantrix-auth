import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        avy: {
          dark: "#0A0A0B",
          card: "#121214",
          border: "#27272A",
          muted: "#71717A",
          red: "#EF4444",
          redDark: "#DC2626",
          light: {
            bg: "#F8F9FA",
            card: "#FFFFFF",
            border: "#E4E4E7",
            text: "#09090B",
            muted: "#71717A",
          }
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
