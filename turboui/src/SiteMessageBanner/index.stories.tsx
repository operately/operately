import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SiteMessageBanner } from ".";

const meta = {
  title: "Components/SiteMessageBanner",
  component: SiteMessageBanner,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SiteMessageBanner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Scheduled maintenance",
    description: "Operator-authored notice with details about scheduled maintenance.",
    onDismiss: () => {},
  },
  render: (args) => {
    const [dismissed, setDismissed] = React.useState(false);

    return dismissed ? <p>Message dismissed</p> : <SiteMessageBanner {...args} onDismiss={() => setDismissed(true)} />;
  },
};
