import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { ContentListSkeleton } from ".";

const meta = {
  title: "Components/ContentListSkeleton",
  component: ContentListSkeleton,
  decorators: [
    (Story) => (
      <div className="max-w-3xl p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ContentListSkeleton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const CheckIns: Story = { args: { label: "Loading check-ins" } };
export const Discussions: Story = { args: { label: "Loading discussions" } };
export const Feed: Story = { args: { variant: "feed", label: "Loading more activities" } };
export const Documents: Story = { args: { leadingShape: "document", label: "Loading documents", count: 4 } };
