/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // shadcn/ui CSS Variables
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        // Primary brand colors - Dark Blue (#1b52a4)
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "#e6f3ff",
          100: "#b3d9ff",
          200: "#80bfff",
          300: "#4da5ff",
          400: "#1a8bff",
          500: "#1b52a4", // Dark Blue - Main brand color
          600: "#154a8f",
          700: "#0f427a",
          800: "#093a65",
          900: "#033250",
        },

        // Secondary colors - Bright Blue (#00a2e5)
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          50: "#e6f9ff",
          100: "#b3edff",
          200: "#80e1ff",
          300: "#4dd5ff",
          400: "#1ac9ff",
          500: "#00a2e5", // Bright Blue
          600: "#0091cc",
          700: "#0080b3",
          800: "#006f99",
          900: "#005e80",
        },

        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          yellow: {
            50: "#fffdf0",
            100: "#fff8cc",
            200: "#fff399",
            300: "#ffee66",
            400: "#ffe933",
            500: "#fec40d", // Yellow
            600: "#e5b00c",
            700: "#cc9c0b",
            800: "#b3880a",
            900: "#997409",
          },
          orange: {
            50: "#fef7f0",
            100: "#fdebd1",
            200: "#fbdfb2",
            300: "#f9d393",
            400: "#f7c774",
            500: "#f58020", // Orange
            600: "#dd731d",
            700: "#c5661a",
            800: "#ad5917",
            900: "#954c14",
          },
          red: {
            50: "#fdf2f2",
            100: "#fbe6e6",
            200: "#f9d9d9",
            300: "#f7cccc",
            400: "#f5bfbf",
            500: "#d64246", // Red
            600: "#c13b3f",
            700: "#ac3438",
            800: "#972d31",
            900: "#82262a",
          },
          green: {
            50: "#f0f9f6",
            100: "#d1f0e6",
            200: "#b2e7d6",
            300: "#93dec6",
            400: "#74d5b6",
            500: "#098855", // Dark Green
            600: "#087a4c",
            700: "#076c43",
            800: "#065e3a",
            900: "#055031",
          },
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // Semantic colors
        success: "#098855", // Dark Green
        warning: "#fec40d", // Yellow
        error: "#d64246", // Red
        info: "#00a2e5", // Bright Blue

        // SolviQ brand palette — use as bg-brand-blue, text-brand-green, etc.
        brand: {
          blue: {
            DEFAULT: "#1b52a4",
            dark: "#0f3b79",
            light: "#3d97ef",
          },
          cyan: {
            DEFAULT: "#00a2e5",
            dark: "#0091cc",
          },
          green: {
            DEFAULT: "#098855",
            dark: "#076e44",
            light: "#40c598",
          },
          yellow: {
            DEFAULT: "#fec40d",
          },
          orange: {
            DEFAULT: "#f58020",
          },
          red: {
            DEFAULT: "#d64246",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "fade-in": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        "fade-in-up": {
          from: { opacity: 0, transform: "translateY(20px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        "fade-in-down": {
          from: { opacity: 0, transform: "translateY(-20px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: 0, transform: "translateX(-20px)" },
          to: { opacity: 1, transform: "translateX(0)" },
        },
        "slide-in-left": {
          from: { opacity: 0, transform: "translateX(20px)" },
          to: { opacity: 1, transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: 0, transform: "scale(0.95)" },
          to: { opacity: 1, transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.8 },
        },
        "bounce-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "fade-in-up": "fade-in-up 0.6s ease-out",
        "fade-in-down": "fade-in-down 0.6s ease-out",
        "slide-in-right": "slide-in-right 0.5s ease-out",
        "slide-in-left": "slide-in-left 0.5s ease-out",
        "scale-in": "scale-in 0.5s ease-out",
        shimmer: "shimmer 2s infinite linear",
        "pulse-slow": "pulse-slow 3s ease-in-out infinite",
        "bounce-slow": "bounce-slow 2s ease-in-out infinite",
      },
      backgroundImage: {
        "mock-page-bg":
          "linear-gradient(135deg, rgba(9,136,85,.10) 0%, rgba(0,162,229,.08) 25%, rgba(255,255,255,.95) 50%, rgba(254,196,13,.06) 70%, rgba(245,128,32,.05) 85%, rgba(27,82,164,.08) 100%)",

        "brand-nav2":
          "linear-gradient(135deg, rgba(255,255,255,.98) 0%, rgba(244,255,249,.96) 30%, rgba(238,247,255,.96) 70%, rgba(255,250,240,.95) 100%)",

        "brand-nav":
          "linear-gradient(135deg, rgba(247,255,251,.96) 0%, rgba(237,248,255,.95) 50%, rgba(255,249,240,.95) 100%)",

        "brand-nav-dark":
          "linear-gradient(135deg, rgba(10,20,42,.95) 0%, rgba(14,36,58,.94) 100%)",
        "brand-hero-2":
          "linear-gradient(135deg, rgba(27,82,164,1) 0%, rgba(36,92,190,1) 35%, rgba(0,162,229,1) 70%, rgba(245,128,32,0.2) 100%)",

        "brand-hero-dark-2":
          "linear-gradient(135deg, #081426 0%, rgba(27,82,164,.45) 50%, rgba(245,128,32,.22) 100%)",
        "brand-hero":
          "linear-gradient(135deg, rgba(9,136,85,.20) 0%, rgba(0,162,229,.16) 35%, rgba(254,196,13,.10) 65%, rgba(27,82,164,.14) 100%)",

        "brand-hero-dark":
          "linear-gradient(135deg, #08101f 0%, rgba(18,38,68,.45) 55%, #08101f 100%)",

        "brand-card":
          "linear-gradient(135deg, #098855 0%, #00A2E5 50%, #1B52A4 100%)",

        "brand-card-dark":
          "linear-gradient(135deg, #066F45 0%, #007DB2 50%, #123C7A 100%)",
      },
      // backgroundImage: {
      //   "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      //   "gradient-conic":
      //     "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      //   "shimmer-gradient":
      //     "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
      //   "brand-hero":
      //     "linear-gradient(to bottom right, rgb(9 136 85 / 0.3), rgb(0 162 229 / 0.15), rgb(27 82 164 / 0.32))",
      //   "brand-hero-dark":
      //     "linear-gradient(to bottom right, #080e23, rgb(26 44 88 / 0.35), #080e23)",
      //   "brand-card": "linear-gradient(to bottom right, #1b52a4, #098855)",
      //   "brand-card-dark": "linear-gradient(to bottom right, #0f3b79, #076e44)",
      //   // Glassy brand surface for navbar & sidebar — uniform (non-directional) so it
      //   // looks identical on both the wide navbar and the narrow/tall sidebar.
      //   // Stacked translucent solids blend green+cyan+blue over a white/navy base.
      //   "mock-page-bg":
      //     "linear-gradient(135deg, rgba(9,136,85,.12) 0%, rgba(0,162,229,.08) 35%, rgba(255,255,255,.96) 65%, rgba(27,82,164,.10) 100%)",
      //   "brand-nav2":
      //     "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(247,251,255,0.94) 55%, rgba(238,246,255,0.95) 100%)",
      //   "brand-nav":
      //     "linear-gradient(135deg, rgba(236, 255, 248, 0.96) 0%, rgba(225, 247, 255, 0.95) 45%, rgba(214, 238, 255, 0.94) 100%)",
      //   "brand-nav-dark":
      //     "linear-gradient(rgb(9 136 85 / 0.08), rgb(9 136 85 / 0.08)), linear-gradient(rgb(0 162 229 / 0.08), rgb(0 162 229 / 0.08)), linear-gradient(rgb(27 82 164 / 0.10), rgb(27 82 164 / 0.10)), linear-gradient(rgb(10 21 51 / 0.92), rgb(10 21 51 / 0.92))",
      // },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
