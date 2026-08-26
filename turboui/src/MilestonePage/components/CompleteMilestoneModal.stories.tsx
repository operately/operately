import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

import type * as Types from "../../TaskBoard/types";
import { CompleteMilestoneModal } from "./CompleteMilestoneModal";

const closedStatuses: Types.Status[] = [
  { id: "done", value: "done", label: "Done", color: "green", icon: "circleCheck", index: 0, closed: true },
  { id: "canceled", value: "canceled", label: "Canceled", color: "red", icon: "circleX", index: 1, closed: true },
];

const meta = {
  title: "Pages/MilestonePage/CompleteMilestoneModal",
  component: CompleteMilestoneModal,
  args: {
    isOpen: true,
    milestoneName: "Beta launch",
    openTaskCount: 3,
    closedStatuses,
    onClose: () => undefined,
    onComplete: async () => true,
  },
} satisfies Meta<typeof CompleteMilestoneModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
