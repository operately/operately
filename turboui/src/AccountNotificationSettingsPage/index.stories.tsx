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
  emailPreference: "buffered" as const,
  emailWindowMinutes: 15 as const,
  sendDailySummary: true,
  onEmailPreferenceChange: () => undefined,
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
    emailPreference: "mentions_only",
  },
};

export const Saving: Story = {
  args: {
    ...defaultArgs,
    isSubmitting: true,
  },
};
