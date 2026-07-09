import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    {
      name: "@storybook/addon-essentials",
      options: {
        backgrounds: false,
      },
    },
    "@storybook/addon-interactions",
    "@storybook/addon-themes",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  typescript: {
    // Avoid Babel/lru-cache clash in react-docgen during static builds (Cloudflare Pages).
    reactDocgen: false,
  },
  core: {
    builder: "@storybook/builder-vite",
  },
  viteFinal: async (config) => {
    // Storybook enables PostCSS with a boolean; Vite's CSS options type expects an object.
    // @ts-expect-error Storybook PostCSS boolean flag
    config.css = { postcss: true };

    return config;
  },
};

export default config;
