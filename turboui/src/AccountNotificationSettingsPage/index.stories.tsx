import type { Meta, StoryObj } from "@storybook/react";
import { AccountNotificationSettingsPage } from "./index";

const meta = {
  title: "Pages/AccountNotificationSettingsPage",
  component: AccountNotificationSettingsPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AccountNotificationSettingsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultArgs = {
  notifyOnMention: false,
  emailWindowMinutes: 15 as const,
  sendDailySummary: true,
  onNotifyOnMentionChange: () => undefined,
  onEmailWindowMinutesChange: () => undefined,
  onSendDailySummaryChange: () => undefined,
  onSubmit: async () => undefined,
  onCancel: () => undefined,
  homePath: "#",
  settingsPath: "#",
};

export const Buffered: Story = {
  args: defaultArgs,
};

export const MentionsOnly: Story = {
  args: {
    ...defaultArgs,
    notifyOnMention: true,
  },
};

export const Saving: Story = {
  args: {
    ...defaultArgs,
    isSubmitting: true,
  },
};
