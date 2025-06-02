import type { Decorator, Preview } from "@storybook/react";
import React from "react";

import { withThemeByClassName } from "@storybook/addon-themes";
import { ToasterBar } from "../src/Toasts";
import { RouterDecorator } from "./router";

import "./global.css";

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
    backgrounds: {
      default: "dark",
    },
    layout: "fullscreen",
    viewport: {
      defaultViewport: "reset", // reset the viewport to the default when navigating to a new story
    },
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
};

export default preview;
