import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],
  "framework": {
    "name": "@storybook/react-vite",
    "options": {}
  },
  "core": {
    "builder": "@storybook/builder-vite"
  },
  viteFinal: async (config) => {
    config.css = {
      postcss: true,
    };
    return config;
  }
};

export default config;
