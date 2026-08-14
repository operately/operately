import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { defaultFormattedTimePreferences } from "../FormattedTime";
import { shortParagraphsRelease, v18ProductRelease } from "../HomePage/mockData";
import { ProductReleaseAnnouncement } from "./index";

const meta = {
  title: "Components/ProductReleaseAnnouncement",
  component: ProductReleaseAnnouncement,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ProductReleaseAnnouncement>;

export default meta;
type Story = StoryObj<typeof meta>;

function InteractiveAnnouncement(props: Omit<ProductReleaseAnnouncement.Props, "onDismiss">) {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-content-dimmed">
        Announcement dismissed. Refresh the story to see it again.
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-surface-dimmed">
      <ProductReleaseAnnouncement {...props} onDismiss={() => setDismissed(true)} />
    </div>
  );
}

export const Toast: Story = {
  args: {
    release: v18ProductRelease,
    onDismiss: () => {},
    formattedTimePreferences: defaultFormattedTimePreferences,
  },
  render: (args) => <InteractiveAnnouncement {...args} />,
};

export const ModalOpen: Story = {
  args: {
    release: v18ProductRelease,
    onDismiss: () => {},
    formattedTimePreferences: defaultFormattedTimePreferences,
    defaultModalOpen: true,
  },
  render: (args) => <InteractiveAnnouncement {...args} />,
};

export const ShortParagraphs: Story = {
  args: {
    release: shortParagraphsRelease,
    onDismiss: () => {},
    formattedTimePreferences: defaultFormattedTimePreferences,
    defaultModalOpen: true,
  },
  render: (args) => <InteractiveAnnouncement {...args} />,
};
