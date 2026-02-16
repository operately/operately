// See the Tailwind configuration guide for advanced usage
// https://tailwindcss.com/docs/configuration

const plugin = require("tailwindcss/plugin");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx}", ".storybook/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        fadeIn: "fadeIn 0.3s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(-4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      colors: {
        "surface-bg": "var(--color-surface-bg)",
        "surface-bg-highlight": "var(--color-surface-bg-highlight)",
        "surface-base": "var(--color-surface-base)",
        "surface-dimmed": "var(--color-surface-dimmed)",
        "surface-outline": "var(--color-surface-outline)",
        "surface-accent": "var(--color-surface-accent)",
        "surface-highlight": "var(--color-surface-highlight)",

        "content-base": "var(--color-content)",
        "content-accent": "var(--color-content-accent)",
        "content-dimmed": "var(--color-content-dimmed)",
        "content-subtle": "var(--color-content-subtle)",
        "content-error": "var(--color-content-error)",

        "stroke-base": "var(--color-stroke-base)",
        "stroke-dimmed": "var(--color-stroke-dimmed)",

        "link-base": "var(--color-link-base)",
        "link-hover": "var(--color-link-hover)",

        "toggle-active": "var(--color-toggle-active)",

        "accent-1": "var(--color-accent-1)",
        "accent-1-light": "var(--color-accent-1-light)",

        "callout-info-bg": "var(--color-callout-info-bg)",
        "callout-info-content": "var(--color-callout-info-content)",

        "callout-warning-bg": "var(--color-callout-warning-bg)",
        "callout-warning-content": "var(--color-callout-warning-content)",

        "callout-error-bg": "var(--color-callout-error-bg)",
        "callout-error-content": "var(--color-callout-error-content)",

        "callout-success-bg": "var(--color-callout-success-bg)",
        "callout-success-content": "var(--color-callout-success-content)",

        brand: {
          1: "#3185FF",
          2: "#E3F2FF",
        },

        success: "#059669",

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
      fontSize: {
        xxs: "0.625rem", // 10px
        micro: "0.5rem", // 8px
      },
    },
  },
  plugins: [
    function ({ addBase, theme }) {
      function extractColorVars(colorObj, colorGroup = "") {
        return Object.keys(colorObj).reduce((vars, colorKey) => {
          const value = colorObj[colorKey];

          const newVars =
            typeof value === "string"
              ? { [`--color${colorGroup}-${colorKey}`]: value }
              : extractColorVars(value, `-${colorKey}`);

          return { ...vars, ...newVars };
        }, {});
      }

      addBase({
        ":root": extractColorVars(theme("colors")),
      });
    },
  ],
};
