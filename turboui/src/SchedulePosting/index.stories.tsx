import type { Meta, StoryObj } from "@storybook/react-vite";
import React, { useState } from "react";

import { GhostButton } from "../Button";
import { defaultFormattedTimePreferences } from "../FormattedTime/types";
import { ScheduleFlowControls, type ScheduleFlowState } from "./ScheduleFlowControls";
import { ScheduleModal } from "./ScheduleModal";
import { ScheduleNotice } from "./ScheduleNotice";

const meta = {
  title: "Components/SchedulePosting",
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;

function useStoryScheduleFlow(initialScheduledAt: Date | null = null): ScheduleFlowState {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(initialScheduledAt);
  const [isScheduledLocally, setIsScheduledLocally] = useState(initialScheduledAt !== null);

  return {
    isModalOpen,
    setIsModalOpen,
    isScheduledLocally,
    scheduledAt,
    openScheduleModal: () => setIsModalOpen(true),
    confirmSchedule: (date: Date) => {
      setScheduledAt(date);
      setIsScheduledLocally(true);
      setIsModalOpen(false);
    },
    cancelSchedule: () => setIsModalOpen(false),
    primaryButtonLabel: (immediateLabel: string) => (isScheduledLocally ? "Confirm" : immediateLabel),
  };
}

function ScheduleModalDemo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-4">
      <GhostButton onClick={() => setOpen(true)}>Open schedule modal</GhostButton>
      <ScheduleModal
        open={open}
        onOpenChange={setOpen}
        onSchedule={(date) => {
          console.log("Scheduled for", date.toISOString());
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
        scheduledAt={null}
        formattedTimePreferences={defaultFormattedTimePreferences}
        title="Schedule Discussion"
      />
    </div>
  );
}

function FlowImmediateDemo() {
  const scheduleFlow = useStoryScheduleFlow();

  return (
    <div className="w-[480px]">
      <ScheduleFlowControls
        scheduleFlow={scheduleFlow}
        primaryLabel="Post"
        onPrimaryClick={() => console.log("Post now")}
        formattedTimePreferences={defaultFormattedTimePreferences}
        modalTitle="Schedule Discussion"
        testId="post-discussion"
        secondaryAction={<GhostButton onClick={() => console.log("Save draft")}>Save as draft</GhostButton>}
      />
    </div>
  );
}

function FlowScheduledDemo() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  const scheduleFlow = useStoryScheduleFlow(tomorrow);

  return (
    <div className="w-[480px]">
      <ScheduleFlowControls
        scheduleFlow={scheduleFlow}
        primaryLabel="Post"
        onPrimaryClick={() => console.log("Confirm schedule", scheduleFlow.scheduledAt)}
        formattedTimePreferences={defaultFormattedTimePreferences}
        modalTitle="Schedule Discussion"
        testId="post-discussion"
        secondaryAction={<GhostButton onClick={() => console.log("Save draft")}>Save as draft</GhostButton>}
      />
    </div>
  );
}

function FlowInteractiveDemo() {
  const scheduleFlow = useStoryScheduleFlow();

  return (
    <div className="w-[480px] space-y-3">
      <p className="text-sm text-content-dimmed">
        Use the dropdown to schedule, then edit the date from the notice banner.
      </p>
      <ScheduleFlowControls
        scheduleFlow={scheduleFlow}
        primaryLabel="Submit"
        onPrimaryClick={() => {
          if (scheduleFlow.isScheduledLocally) {
            console.log("Confirm schedule", scheduleFlow.scheduledAt);
          } else {
            console.log("Submit now");
          }
        }}
        formattedTimePreferences={defaultFormattedTimePreferences}
        modalTitle="Schedule Check-in"
        secondaryAction={<GhostButton onClick={() => console.log("Save draft")}>Save as draft</GhostButton>}
      />
    </div>
  );
}

/**
 * Modal for picking a future date and time to publish a post.
 */
export const Modal: StoryObj = {
  render: () => <ScheduleModalDemo />,
};

/**
 * Banner shown above submit buttons after a schedule date has been chosen.
 */
export const Notice: StoryObj = {
  render: () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    return (
      <div className="w-[480px]">
        <ScheduleNotice
          date={tomorrow}
          onEdit={() => console.log("Edit schedule")}
          formattedTimePreferences={defaultFormattedTimePreferences}
        />
      </div>
    );
  },
};

/**
 * Immediate post state: OptionsButton with "Schedule for later" in the dropdown.
 */
export const FlowImmediate: StoryObj = {
  name: "Flow / Immediate",
  render: () => <FlowImmediateDemo />,
};

/**
 * Scheduled state: notice above the button row, primary label switches to "Confirm".
 */
export const FlowScheduled: StoryObj = {
  name: "Flow / Scheduled",
  render: () => <FlowScheduledDemo />,
};

/**
 * Interactive flow: open the modal from the dropdown, confirm a date, then edit it.
 */
export const FlowInteractive: StoryObj = {
  name: "Flow / Interactive",
  render: () => <FlowInteractiveDemo />,
};
