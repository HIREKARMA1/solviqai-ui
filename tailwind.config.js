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
        
        // Brand colors
        brand: {
          blue: "#1b52a4",
          brightBlue: "#00a2e5",
          yellow: "#fec40d",
          orange: "#f58020",
          red: "#d64246",
          green: "#098855",
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
        "shimmer": {
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
        "shimmer": "shimmer 2s infinite linear",
        "pulse-slow": "pulse-slow 3s ease-in-out infinite",
        "bounce-slow": "bounce-slow 2s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "shimmer-gradient": "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
