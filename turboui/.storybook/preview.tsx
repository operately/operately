import type { Decorator, Preview } from "@storybook/react-vite";
import React from "react";

import { withThemeByClassName } from "@storybook/addon-themes";
import { ToasterBar } from "../src/Toasts";
import { RouterDecorator } from "./router";

import "./global.css";
import "../src/i18n";

window.STORYBOOK_ENV = true;

const App: Decorator = (Story, _): React.ReactElement => {
  return (
    <div>
      <ToasterBar />
      <Story />
    </div>
  );
};

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "fullscreen",
    viewport: {},
  },

  decorators: [
    RouterDecorator,
    withThemeByClassName({
      themes: {
        light: "light antialiased",
        dark: "dark antialiased",
      },
      defaultTheme: "light",
      parentSelector: "body",
    }),
    App,
  ],

  initialGlobals: {
    viewport: {
      value: "reset",
      isRotated: false,
    },
  },
};

export default preview;
