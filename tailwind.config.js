/** @type {import('tailwindcss').Config} */
// FitSense AI - web theme tokens (mirrors the Android FitSenseColors palette).
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    screens: {
      xs: "375px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      maxWidth: {
        app: "var(--app-max-width)",
        content: "48rem",
      },
      minHeight: {
        screen: ["100vh", "100dvh"],
      },
      colors: {
        // Neutrals - dark sneaker-tech surface stack
        surface: {
          0: "#0A0F1C",
          1: "#10162A",
          2: "#161D33",
          3: "#1F2740",
        },
        ink: {
          DEFAULT: "#E8ECF7",
          muted: "#8B93AE",
          dim: "#555E78",
          soft: "#A8B0C8",
        },
        warning: {
          DEFAULT: "#FFB020",
          muted: "#FFB020",
        },
        // Brand accents
        neon: "#00E5C7",
        lime: "#B8FF5C",
        violet: "#7C4DFF",
        coral: "#FF6B6B",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: ["Sora", "Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "scan-grad":
          "linear-gradient(135deg, rgba(0,229,199,0.95), rgba(124,77,255,0.85))",
        "hero-grad": "linear-gradient(135deg, #7C4DFF 0%, #00E5C7 100%)",
        "card-grad": "linear-gradient(145deg, #161D33 0%, #1F2740 100%)",
      },
      boxShadow: {
        glow: "0 0 32px -8px rgba(0,229,199,0.45)",
        neon: "0 8px 24px -10px rgba(0,229,199,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        pulseGlow: {
          "0%,100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        scanSweep: {
          "0%": { transform: "translateY(0%)" },
          "100%": { transform: "translateY(100%)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        pulseGlow: "pulseGlow 1.6s ease-in-out infinite",
        scanSweep: "scanSweep 2.4s linear infinite",
        fadeUp: "fadeUp 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};
