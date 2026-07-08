import type { Meta, StoryObj } from "@storybook/react";
import { AccountSecurityPage } from "./index";

const meta = {
  title: "Pages/AccountSecurityPage",
  component: AccountSecurityPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AccountSecurityPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultArgs = {
  homePath: "#",
  changePasswordPath: "#",
  apiTokensPath: "#",
  mcpConnectionsPath: "#",
};

export const Default: Story = {
  args: defaultArgs,
};

export const Mobile: Story = {
  args: defaultArgs,
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};
