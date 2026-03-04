import type { Meta, StoryObj } from "@storybook/react";
import { AccountApiTokensPage } from "./index";

const meta = {
  title: "Pages/AccountApiTokensPage",
  component: AccountApiTokensPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AccountApiTokensPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const now = new Date().toISOString();

const defaultArgs: AccountApiTokensPage.Props = {
  tokens: [
    {
      id: "token_abc123",
      readOnly: true,
      name: "Deploy Bot",
      insertedAt: now,
      lastUsedAt: now,
    },
    {
      id: "token_def456",
      readOnly: false,
      name: null,
      insertedAt: now,
      lastUsedAt: null,
    },
  ],
  newTokenReadOnly: true,
  setNewTokenReadOnly: () => {},
  creatingToken: false,
  onCreateToken: () => {},
  onDismissNewlyCreatedToken: () => {},
  newlyCreatedToken: null,
  pendingTokenActions: {},
  onToggleReadOnly: () => {},
  onDeleteToken: () => {},
  onUpdateName: async () => true,
  homePath: "#",
  securityPath: "#",
  usagePath: "#",
};

export const Default: Story = {
  args: defaultArgs,
};

export const EmptyState: Story = {
  args: {
    ...defaultArgs,
    tokens: [],
  },
};

export const TokenJustCreated: Story = {
  args: {
    ...defaultArgs,
    newlyCreatedToken: "opk_1234567890abcdefghijklmnopqrstuvwxyz",
  },
};
