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
          DEFAULT: "#0a0b0e",
          subtle: "#13141a",
          elevated: "#1c1d24",
        },
        border: {
          DEFAULT: "#2a2c34",
          strong: "#3d404a",
        },
        fg: {
          DEFAULT: "#f2f3f5",
          muted: "#8e8f96",
          subtle: "#5d5e66",
        },
        brand: {
          DEFAULT: "#f2f3f5",
          hover: "#ffffff",
          subtle: "#1c1d24",
        },
        severity: {
          critical: "#ef4444",
          high: "#f97316",
          medium: "#eab308",
          low: "#22c55e",
          info: "#3b82f6",
        },

        background: "#0a0b0e",
        foreground: "#f2f3f5",
        card: "#13141a",
        "card-foreground": "#f2f3f5",
        popover: "#13141a",
        "popover-foreground": "#f2f3f5",
        primary: "#f2f3f5",
        "primary-foreground": "#0a0b0e",
        secondary: "#1c1d24",
        "secondary-foreground": "#f2f3f5",
        muted: "#1c1d24",
        "muted-foreground": "#8e8f96",
        accent: "#f2f3f5",
        "accent-foreground": "#0a0b0e",
        destructive: "#ef4444",
        "destructive-foreground": "#ffffff",
        input: "#1c1d24",
        ring: "#f2f3f5",
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
