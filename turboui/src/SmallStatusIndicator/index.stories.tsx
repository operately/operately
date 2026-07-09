import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { SmallStatusIndicator } from "./index";

const meta: Meta<typeof SmallStatusIndicator> = {
  title: "Components/SmallStatusIndicator",
  component: SmallStatusIndicator,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof SmallStatusIndicator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <SmallStatusIndicator status="on_track" />
      <SmallStatusIndicator status="caution" />
      <SmallStatusIndicator status="off_track" />
    </div>
  ),
};
