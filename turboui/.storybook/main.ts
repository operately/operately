import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: ["@storybook/addon-themes", "@storybook/addon-docs"],

  framework: {
    name: "@storybook/react-vite",
    options: {},
  },

  core: {
    builder: "@storybook/builder-vite",
  },

  viteFinal: async (config) => {
    config.css = {
      postcss: true,
    };

    return config;
  },

  features: {
    backgrounds: false
  }
};

export default config;
