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

const Content = ({ title }: { title: string }) => (
  <div className="p-8 bg-white rounded shadow min-h-96 text-center font-bold text-2xl">
    {title}
  </div>
);

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

export const Default: Story = {
  args: {
    title: "Simple Page",
    navigation: [
      { label: "Product", to: "#" },
      { label: "Workmap", to: "#" },
      { label: "Project Alpha", to: "#" },
    ],
    children: <Content title="Page Content" />,
  },
};

export const SizeTiny: Story = {
  args: {
    title: "Tiny Size",
    size: "tiny",
    navigation: [
      { label: "Product", to: "#" },
      { label: "Workmap", to: "#" },
      { label: "Project Alpha", to: "#" },
    ],
    children: <Content title="Tiny size" />,
  },
};

export const SizeSmall: Story = {
  args: {
    title: "Small Size",
    size: "small",
    navigation: [
      { label: "Product", to: "#" },
      { label: "Workmap", to: "#" },
      { label: "Project Alpha", to: "#" },
    ],
    children: <Content title="Small size" />,
  },
};

export const SizeMedium: Story = {
  args: {
    title: "Medium Size",
    size: "medium",
    navigation: [
      { label: "Product", to: "#" },
      { label: "Workmap", to: "#" },
      { label: "Project Alpha", to: "#" },
    ],
    children: <Content title="Medium size" />,
  },
};

export const SizeLarge: Story = {
  args: {
    title: "Large Size",
    size: "large",
    navigation: [
      { label: "Product", to: "#" },
      { label: "Workmap", to: "#" },
      { label: "Project Alpha", to: "#" },
    ],
    children: <Content title="Large size" />,
  },
};

export const SizeXLarge: Story = {
  args: {
    title: "XLarge Size",
    size: "xlarge",
    navigation: [
      { label: "Product", to: "#" },
      { label: "Workmap", to: "#" },
      { label: "Project Alpha", to: "#" },
    ],
    children: <Content title="XLarge size" />,
  },
};

export const SizeXXLarge: Story = {
  args: {
    title: "XXLarge Size",
    size: "xxlarge",
    navigation: [
      { label: "Product", to: "#" },
      { label: "Workmap", to: "#" },
      { label: "Project Alpha", to: "#" },
    ],
    children: <Content title="XXLarge size" />,
  },
};

export const SizeFullWidth: Story = {
  args: {
    title: "Full Width Size",
    size: "fullwidth",
    navigation: [
      { label: "Product", to: "#" },
      { label: "Workmap", to: "#" },
      { label: "Project Alpha", to: "#" },
    ],
    children: <Content title="Full width size" />,
  },
};
