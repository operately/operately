import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Page } from "./index";

const meta = {
  title: "Components/Page",
  component: Page,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="mt-12">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Page>;

export default meta;
type Story = StoryObj<typeof meta>;

const DemoIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 5V19M5 12H19"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const Basic: Story = {
  args: {
    title: "Simple Page",
    children: <div className="p-4 bg-white rounded shadow">Page Content</div>,
  },
};

export const WithNavigation: Story = {
  args: {
    title: ["Projects", "Project Name", "Settings"],
    children: <div className="p-4 bg-white rounded shadow">Page Content</div>,
  },
};

export const WithOptions: Story = {
  args: {
    title: "Page With Options",
    options: [
      { icon: <DemoIcon />, title: "Add Item" },
      { icon: <DemoIcon />, title: "Settings" },
    ],
    children: <div className="p-4 bg-white rounded shadow">Page Content</div>,
  },
};

export const DifferentSizes: Story = {
  args: {
    title: "Different Sizes",
  },
  render: () => (
    <div className="space-y-4">
      {[
        "tiny",
        "small",
        "medium",
        "large",
        "xlarge",
        "xxlarge",
        "fullwidth",
      ].map((size) => (
        <Page key={size} title={`${size} size`} size={size as any}>
          <div className="p-4 bg-white rounded shadow w-full">
            Content with {size} width
          </div>
        </Page>
      ))}
    </div>
  ),
};
