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
        brand: {
          base: "#3185FF",
          2: "#E3F2FF",
        },
        light: {
          base: "#FFFFFF",
          1: "#F9FAF7",
          2: "#F1F2EF",
          gray: "#F9FAF7",
        },
        dark: {
          base: "#000000",
          1: "#333333",
          2: "#878787",
          "7%": "rgba(0, 0, 0, 0.07)",
          "8%": "rgba(0, 0, 0, 0.08)",
        },
        success: {
          base: "#548B53",
          2: "#D7ECD7",
        },

        new: {
          "dark-1": "rgb(22, 22, 22)",
          // "dark-1": "rgba(20, 30, 35, 1)",
          "dark-2": "rgba(255, 255, 255, 0.03)",
          "dark-3": "rgba(255, 255, 255, 0.9)",
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
  ],
};
