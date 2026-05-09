import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "./frontend/app/**/*.{ts,tsx}",
    "./frontend/components/**/*.{ts,tsx}",
    "./frontend/hooks/**/*.{ts,tsx}",
    "./frontend/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#1a2333",
          subtle: "#222c3d",
          elevated: "#2a3548",
        },
        border: {
          DEFAULT: "#3d4a5f",
          strong: "#56657e",
        },
        fg: {
          DEFAULT: "#e9eef0",
          muted: "#9aa6ad",
          subtle: "#6b7780",
        },
        brand: {
          DEFAULT: "#1D9E75",
          hover: "#168562",
          subtle: "#0f2a23",
        },
        severity: {
          critical: "#ef4444",
          high: "#f97316",
          medium: "#eab308",
          low: "#22c55e",
          info: "#3b82f6",
        },

        background: "#1a2333",
        foreground: "#eef1f6",
        card: "#242f42",
        "card-foreground": "#eef1f6",
        popover: "#242f42",
        "popover-foreground": "#eef1f6",
        primary: "#1D9E75",
        "primary-foreground": "#ffffff",
        secondary: "#2a3548",
        "secondary-foreground": "#eef1f6",
        muted: "#2d3a50",
        "muted-foreground": "#a8b0bf",
        accent: "#1D9E75",
        "accent-foreground": "#ffffff",
        destructive: "#ef4444",
        "destructive-foreground": "#ffffff",
        input: "#2a3548",
        ring: "#1D9E75",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        // Historical name: used on headings via `font-serif`; stack is sans-only.
        serif: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
        mono: [
          "var(--font-geist-mono)",
          "ui-monospace",
          "monospace",
        ],
      },
      animation: {
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "teal-pulse": "teal-pulse 2s ease-in-out infinite",
        "slide-in-up": "slide-in-up 0.5s ease-out forwards",
        "fade-in": "fade-in 0.6s ease-out forwards",
        dash: "dash-animation 1s linear infinite",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "teal-pulse": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        "slide-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "dash-animation": {
          to: { strokeDashoffset: "-20" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
