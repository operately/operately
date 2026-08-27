import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

import { CurrentVersion } from "./index";

const meta = {
  title: "Components/CurrentVersion",
  component: CurrentVersion,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof CurrentVersion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { version: "v1.8" },
  decorators: [
    (Story) => (
      <div className="p-8">
        <Story />
      </div>
    ),
  ],
};

export const DevVersion: Story = {
  args: { version: "dev-version" },
  decorators: Default.decorators,
};
