/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans:    ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        serif:   ["Fraunces", "ui-serif", "Georgia", "serif"],
        mono:    ["'Geist Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },

      colors: {
        // ── Page & surfaces ───────────────────────────────────────
        bg:         "#F8F7F5",   // warm off-white (was #FAFAFB)
        surface:    "#FFFFFF",
        "surface-2":"#F3F2EF",

        // ── Accent — teal doux (was emerald-500 #10B981) ─────────
        // oklch ≈ 0.62 C=0.09 H=190
        teal: {
          50:  "#EAF5F3",
          100: "#C8E8E3",
          200: "#A4D8D1",
          300: "#7DC5BB",
          400: "#55AFA4",
          500: "#3D9B8E",   // PRIMARY — replaces emerald-500
          600: "#2D8579",
          700: "#1E6E63",
          800: "#12574E",
          900: "#094039",
        },
        accent: {
          DEFAULT: "#3D9B8E",   // teal-500
          soft:    "#EAF5F3",   // teal-50
        },

        // ── Chaleur — terre-cuite (positive warmth, soft alerts) ──
        // oklch ≈ 0.72 C=0.09 H=45
        chaleur: {
          50:  "#FBF0EA",
          100: "#F5DDD1",
          200: "#ECC9B5",
          300: "#E0B296",
          400: "#D39A77",
          500: "#C98A6B",   // PRIMARY chaleur
          600: "#B0724F",
          700: "#8C5537",
          800: "#673C23",
          900: "#432614",
        },

        // ── Sage — vert sauge (OK states, stable) ─────────────────
        // oklch ≈ 0.66 C=0.09 H=155
        sage: {
          50:  "#EBF5EF",
          100: "#C9E5D2",
          200: "#A5D2B6",
          300: "#7FBD98",
          400: "#5CA87C",
          500: "#4A9468",   // PRIMARY sage
          600: "#37784F",
          700: "#275C3A",
          800: "#184126",
          900: "#0C2715",
        },

        // ── Traffic lights — "jamais de rouge vif" ────────────────
        // Red is now terracotta-soft, not #EF4444
        traffic: {
          "green-bg":     "#EAF5F3",   // teal-50
          "green-text":   "#1E6E63",   // teal-700
          "green-border": "#A4D8D1",   // teal-200
          "orange-bg":    "#FFF4E6",
          "orange-text":  "#9A5B00",
          "orange-border":"#FFD08A",
          "red-bg":       "#FAF0EE",   // terracotta-50 (was #FDECEC)
          "red-text":     "#8B3A2A",   // terracotta-800 (was #991B1B)
          "red-border":   "#E8C4AE",   // terracotta-200 (was #F7B4B4)
        },

        // ── Neutrals — stone (légèrement plus chauds que slate) ───
        stone: {
          50:  "#FAFAF9",
          100: "#F5F5F4",
          200: "#E7E5E4",
          300: "#D6D3D1",
          400: "#A8A29E",
          500: "#78716C",
          600: "#57534E",
          700: "#44403C",
          800: "#292524",
          900: "#1C1917",
          950: "#0C0A09",
        },
      },

      boxShadow: {
        card:       "0 4px 16px rgba(28, 25, 23, 0.05)",          // plus douce (was 06)
        "card-hover":"0 8px 24px rgba(28, 25, 23, 0.09)",
        glass:      "inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -2px 4px rgba(0,0,0,0.05)",
        teal:       "0 4px 16px rgba(61, 155, 142, 0.25)",        // glow pour CTA teal
        chaleur:    "0 4px 16px rgba(201, 138, 107, 0.25)",
      },

      borderRadius: {
        xl2: "1rem",
        xl3: "1.5rem",
        xl4: "2rem",
      },

      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],  // 11px
      },

      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(24px)", filter: "blur(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)",    filter: "blur(0)" },
        },
        "pulse-ring": {
          "0%, 100%": { opacity: ".3" },
          "50%":      { opacity: "1" },
        },
        "spin-slow": {
          "0%":   { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-up":    "fade-up 0.7s ease-out both",
        "pulse-ring": "pulse-ring 2s ease-in-out infinite",
        "spin-slow":  "spin-slow 4s linear infinite",
      },
    },
  },
  plugins: [],
};
