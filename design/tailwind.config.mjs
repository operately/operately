/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "media",
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        "surface-bg": "var(--color-surface-bg)",
        "surface-bg-highlight": "var(--color-surface-bg-highlight)",
        "surface-base": "var(--color-surface-base)",
        "surface-dimmed": "var(--color-surface-dimmed)",
        "surface-outline": "var(--color-surface-outline)",
        "surface-accent": "var(--color-surface-accent)",
        "surface-highlight": "var(--color-surface-highlight)",

        "content-base": "var(--color-content-base)",
        "content-accent": "var(--color-content-accent)",
        "content-dimmed": "var(--color-content-dimmed)",
        "content-subtle": "var(--color-content-subtle)",
        "content-error": "var(--color-content-error)",

        "stroke-base": "var(--color-stroke-base)",
        "stroke-dimmed": "var(--color-stroke-dimmed)",

        "link-base": "var(--color-link-base)",
        "link-hover": "var(--color-link-hover)",

        "toggle-active": "var(--color-toggle-active)",
        "stale-selection": "var(--color-stale-selection)",

        "accent-1": "var(--color-accent-1)",
        "accent-1-light": "var(--color-accent-1-light)",

        danger: "var(--color-danger)",
        "danger-light": "var(--color-danger-light)",
        "white-1": "var(--color-white-1)",

        "callout-info": "var(--color-callout-info)",
        "callout-info-icon": "var(--color-callout-info-icon)",
        "callout-info-message": "var(--color-callout-info-message)",

        "callout-warning": "var(--color-callout-warning)",
        "callout-warning-icon": "var(--color-callout-warning-icon)",
        "callout-warning-message": "var(--color-callout-warning-message)",

        "callout-error": "var(--color-callout-error)",
        "callout-error-icon": "var(--color-callout-error-icon)",
        "callout-error-message": "var(--color-callout-error-message)",

        "callout-success": "var(--color-callout-success)",
        "callout-success-icon": "var(--color-callout-success-icon)",
        "callout-success-message": "var(--color-callout-success-message)",

        brand: {
          1: "#3185FF",
          2: "#E3F2FF",
        },

        dark: {
          1: "rgba(30,30,34,1)",
          2: "rgba(35,35,39,1)",
          3: "rgba(43,45,49,1)",
          4: "rgba(49,51,56,1)",
          5: "rgba(60,60,64,1)",
          6: "rgba(65,65,69,1)",
          7: "rgba(73,75,79,1)",
          8: "rgba(79,81,86,1)",
        },

        shade: {
          1: "rgba(255,255,255,0.05)",
          2: "rgba(255,255,255,0.1)",
          3: "rgba(255,255,255,0.2)",
        },

        white: {
          1: "rgba(255,255,255,1.00)",
          2: "rgba(255,255,255,0.50)",
          3: "rgba(255,255,255,0.25)",
        },
      },
    },
  },
  plugins: [],
};
