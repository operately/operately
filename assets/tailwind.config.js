// See the Tailwind configuration guide for advanced usage
// https://tailwindcss.com/docs/configuration

const plugin = require("tailwindcss/plugin");

module.exports = {
  content: [
    "./js/**/*.js",
    "./js/**/*.tsx",
    "../lib/*_web.ex",
    "../lib/*_web/**/*.*ex",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          1: "rgba(30,30,34,255)",
          2: "rgba(43,45,49,255)",
          3: "rgba(49,51,56,255)",
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
    require("@tailwindcss/forms"),
    plugin(({ addVariant }) =>
      addVariant("phx-no-feedback", [".phx-no-feedback&", ".phx-no-feedback &"])
    ),
    plugin(({ addVariant }) =>
      addVariant("phx-click-loading", [
        ".phx-click-loading&",
        ".phx-click-loading &",
      ])
    ),
    plugin(({ addVariant }) =>
      addVariant("phx-submit-loading", [
        ".phx-submit-loading&",
        ".phx-submit-loading &",
      ])
    ),
    plugin(({ addVariant }) =>
      addVariant("phx-change-loading", [
        ".phx-change-loading&",
        ".phx-change-loading &",
      ])
    ),
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
