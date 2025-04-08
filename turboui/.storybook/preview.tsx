import React from "react";
import type { Preview } from "@storybook/react";
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
      default: 'light',
      values: [
        {
          name: 'light',
          value: 'rgba(254, 245, 237, 1)',
        },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div className="light antialiased">
        <Story />
      </div>
    ),
  ],
};

export default preview;