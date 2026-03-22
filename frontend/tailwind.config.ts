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
        brand: {
          400: "#38E8FF",
          500: "#00C2FF",
          600: "#0099CC",
        },
        surface: {
          0: "#06080F",
          1: "#0A0F1A",
          2: "#101824",
          3: "#182236",
        },
      },
      fontFamily: {
        sans: ["Onest", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
      },
      boxShadow: {
        card: "0 4px 20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
        "card-hover": "0 8px 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)",
        glow: "0 0 28px rgba(0,194,255,0.18), 0 0 8px rgba(0,194,255,0.1)",
        "glow-sm": "0 0 12px rgba(0,194,255,0.15)",
      },
      animation: {
        shimmer: "shimmer 1.6s ease-in-out infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 16px rgba(0,194,255,0.08)" },
          "50%": { boxShadow: "0 0 28px rgba(0,194,255,0.22)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
