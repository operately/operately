import type { Meta, StoryObj } from "@storybook/react-vite";

import { LobbyPage } from "./index";
import { defaultProps } from "./mockData";

const meta = {
  title: "Pages/LobbyPage",
  component: LobbyPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof LobbyPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: defaultProps,
};

export const SiteAdmin: Story = {
  args: {
    ...defaultProps,
    adminPath: "/admin",
  },
};

export const EmptyCompanies: Story = {
  args: {
    ...defaultProps,
    companies: [],
  },
};

export const CurrentVersion: Story = {
  args: {
    ...defaultProps,
    showCurrentVersion: true,
  },
};

export const MissingVersion: Story = {
  args: {
    ...defaultProps,
    showCurrentVersion: true,
    version: null,
  },
};
