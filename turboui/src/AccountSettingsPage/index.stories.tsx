import type { Meta, StoryObj } from "@storybook/react";
import { AccountSettingsPage } from "./index";

const meta = {
  title: "Pages/AccountSettingsPage",
  component: AccountSettingsPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AccountSettingsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultArgs = {
  homePath: "#",
  appearancePath: "#",
  notificationSettingsPath: "#",
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
