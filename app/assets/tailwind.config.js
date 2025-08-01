const plugin = require("tailwindcss/plugin");

module.exports = {
  darkMode: "class",
  content: [
    "./js/**/*.js",
    "./js/**/*.tsx",
    "../ee/assets/js/**/*.js",
    "../ee/assets/js/**/*.tsx",
    "../lib/*_web.ex",
    "../lib/*_web/**/*.*ex",
    "../../turboui/src/**/*.{js,ts,jsx,tsx}",
  ],
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
    plugin(function ({ addVariant, e }) {
      addVariant("not-first", ({ modifySelectors, separator }) => {
        modifySelectors(({ className }) => {
          return `.${e(`not-first${separator}${className}`)}:not(:first-child)`;
        });
      });
    }),
  ],
  safelist: [
    {
      pattern: /(bg|text)-(green|yellow|red|gray)-(50|100|200|300|400|500|600|700|800|900|950)/,
    },
  ],
};
