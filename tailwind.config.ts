import type { Config } from "tailwindcss";

export default {
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        mono: ["Roboto Mono", "monospace"],
        sans: ["Inter", "sans-serif"],
      },
      fontSize: {
        "3xs": ["0.5625rem", { lineHeight: "0.75rem" }],
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      transitionDuration: {
        fast: "120ms",
        base: "200ms",
        slow: "300ms",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.25, 0.1, 0.25, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      colors: {
        lime: {
          DEFAULT: "hsl(var(--accent-lime))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        connector: "hsl(var(--connector))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
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
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        node: {
          source: "hsl(var(--node-source))",
          action: "hsl(var(--node-action))",
          condition: "hsl(var(--node-condition))",
        },
      },
      boxShadow: {
        node: "var(--shadow-node)",
        "node-hover": "var(--shadow-node-hover)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "0.75rem",
        "2xl": "1rem",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "collapsible-down": {
          from: { height: "0", opacity: "0" },
          to: { height: "var(--radix-collapsible-content-height)", opacity: "1" },
        },
        "collapsible-up": {
          from: { height: "var(--radix-collapsible-content-height)", opacity: "1" },
          to: { height: "0", opacity: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "count-pop": {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.06)" },
          "100%": { transform: "scale(1)" },
        },
        "node-enter": {
          "0%": { opacity: "0", transform: "scale(0.96) translateY(4px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "toolbar-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 200ms cubic-bezier(0.25, 0.1, 0.25, 1)",
        "accordion-up": "accordion-up 200ms cubic-bezier(0.25, 0.1, 0.25, 1)",
        "collapsible-down": "collapsible-down 200ms cubic-bezier(0.25, 0.1, 0.25, 1)",
        "collapsible-up": "collapsible-up 120ms cubic-bezier(0.25, 0.1, 0.25, 1)",
        "fade-in": "fade-in 200ms cubic-bezier(0.25, 0.1, 0.25, 1)",
        "fade-out": "fade-out 200ms cubic-bezier(0.25, 0.1, 0.25, 1)",
        "slide-in-right": "slide-in-right 300ms cubic-bezier(0.25, 0.1, 0.25, 1)",
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
        "count-pop": "count-pop 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "node-enter": "node-enter 200ms cubic-bezier(0.25, 0.1, 0.25, 1)",
        "spin-slow": "spin-slow 2s linear infinite",
        "toolbar-in": "toolbar-in 120ms cubic-bezier(0.25, 0.1, 0.25, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
