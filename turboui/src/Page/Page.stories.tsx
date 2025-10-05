import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Page } from "./index";
import { PageFooter } from "./PageFooter";
import { IconPencil, IconTrash } from "../icons";

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
  <div className="p-8 bg-white rounded shadow min-h-96 text-center font-bold text-2xl">{title}</div>
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

export const WithPageFooter: Story = {
  args: {
    title: "Page with Footer",
    navigation: [
      { label: "Product", to: "#" },
      { label: "Workmap", to: "#" },
      { label: "Project Alpha", to: "#" },
    ],
  },
  render: ({ title, navigation }) => (
    <Page title={title} navigation={navigation}>
      <Content title="Page Content" />
      <PageFooter className="p-8">Page Footer Content. Usually the activity feed goes here.</PageFooter>
    </Page>
  ),
};

export const LongNavigation: Story = {
  args: {
    title: "Long navigation",
    navigation: [
      { to: "/dashboard", label: "Dashboard" },
      { to: "/projects", label: "Projects" },
      { to: "/projects/123", label: "Onboard Peter to the Customer Portal" },
      { to: "/tasks", label: "Tasks" },
      { to: "/documents", label: "Documents" },
      { to: "/analytics", label: "Analytics" },
      { to: "/settings", label: "Settings" },
      { to: "/profile", label: "Profile" },
      { to: "/help", label: "Help" },
    ],
    children: <Content title="Long navigation" />,
  },
};

export const PageOptions: Story = {
  args: {
    title: "Page with options",
    navigation: [
      { label: "Product", to: "#" },
      { label: "Workmap", to: "#" },
      { label: "Project Alpha", to: "#" },
    ],
    options: [
      { type: "action", label: "Edit", onClick: () => alert("Edit clicked"), icon: IconPencil },
      { type: "link", label: "Delete", link: "/delete", icon: IconTrash },
    ],
    children: <Content title="Page with options" />,
  },
};
