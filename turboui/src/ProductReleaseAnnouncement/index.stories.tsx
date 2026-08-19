import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { ProductReleaseAnnouncement } from "./index";
import { v18ProductRelease } from "./mockData";

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
  },
  render: (args) => <InteractiveAnnouncement {...args} />,
};
