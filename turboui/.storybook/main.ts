import type { StorybookConfig } from "@storybook/react-vite";

const localHosts = ["localhost", "127.0.0.1"];
const remoteDevHost = process.env.OPERATELY_DEV_HOST;
const allowedHosts = remoteDevHost ? [...localHosts, remoteDevHost] : localHosts;

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-themes"],

  core: {
    allowedHosts,
  },

  framework: {
    name: "@storybook/react-vite",
    options: {},
  },

  typescript: {
    // Avoid Babel/lru-cache clash in react-docgen during static builds (Cloudflare Pages).
    reactDocgen: false,
  },

  viteFinal: async (config) => {
    // Storybook enables PostCSS with a boolean; Vite's CSS options type expects an object.
    // @ts-expect-error Storybook PostCSS boolean flag
    config.css = { postcss: true };

    return config;
  },
};

export default config;
