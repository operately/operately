import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tooltip } from "./index";
import { Page } from "../Page";
import { IconUser } from "../icons";

const meta: Meta<typeof Tooltip> = {
  title: "Components/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    content: { control: "text" },
    delayDuration: { control: "number" },
  },
  decorators: [
    (Story) => (
      <div className="sm:mt-12">
        <Page size="medium" title={"Tooltip Examples"}>
          <div className="p-12 space-y-8">
            <Story />
          </div>
        </Page>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    content: "This is a basic tooltip with helpful information.",
    children: <span className="underline cursor-help">Hover over me</span>,
  },
};

export const RichContent: Story = {
  args: {
    content: (
      <div className="max-w-sm">
        <div className="font-semibold mb-2">Project Management Roles</div>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Champion:</span> Project owner and leader
          </div>
          <div>
            <span className="font-medium">Reviewer:</span> Provides oversight and approval
          </div>
          <div>
            <span className="font-medium">Contributors:</span> Team members working on tasks
          </div>
        </div>
      </div>
    ),
    children: (
      <div className="flex items-center gap-2 p-3 border border-surface-outline rounded-lg cursor-help">
        <IconUser className="w-5 h-5 text-content-dimmed" />
        <span>View Role Descriptions</span>
      </div>
    ),
  },
};