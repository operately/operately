import React from "react";
import type { Preview } from "@storybook/react";
import { withThemeByClassName } from '@storybook/addon-themes';

import "./global.css";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark'
    },
    layout: 'fullscreen',
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: 'light antialiased',
        dark: 'dark antialiased',
      },
      defaultTheme: 'light',
      parentSelector: 'body',
    })
  ]
};

export default preview;
