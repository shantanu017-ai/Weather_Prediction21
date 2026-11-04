import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        primary: {
          DEFAULT: "#0284c7",
          foreground: "#ffffff",
        },
        aqi: {
          good: "#10b981",
          satisfactory: "#22c55e",
          moderate: "#eab308",
          poor: "#f97316",
          veryPoor: "#ef4444",
          severe: "#881337",
        }
      },
    },
  },
  plugins: [],
};
export default config;
