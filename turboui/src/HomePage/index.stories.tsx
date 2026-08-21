import type { Meta, StoryObj } from "@storybook/react-vite";

import { HomePage } from "./index";
import { defaultProps } from "./mockData";

const meta = {
  title: "Pages/HomePage",
  component: HomePage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof HomePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: defaultProps,
};

export const EmptySpaces: Story = {
  args: {
    ...defaultProps,
    spaces: [],
  },
};

export const RestrictedPermissions: Story = {
  args: {
    ...defaultProps,
    canCreateSpace: false,
    canInviteMembers: false,
  },
};

export const EveningGreeting: Story = {
  args: {
    ...defaultProps,
    now: new Date("2026-08-21T20:00:00"),
  },
};
