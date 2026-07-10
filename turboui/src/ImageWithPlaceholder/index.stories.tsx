import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ImageWithPlaceholder } from "./index";

const meta: Meta<typeof ImageWithPlaceholder> = {
  title: "Components/ImageWithPlaceholder",
  component: ImageWithPlaceholder,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[480px] max-w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    src: "https://placehold.co/1200x800/png?text=Resource+Hub+Preview",
    alt: "Sample resource hub preview",
    ratio: 2 / 3,
  },
};
