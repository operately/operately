import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ScheduleFlowControls, type ScheduleFlowState } from "../ScheduleFlowControls";
import { defaultFormattedTimePreferences } from "../../utils/storybook/formattedTime";

function scheduleFlow(): ScheduleFlowState {
  return {
    isModalOpen: false,
    setIsModalOpen: jest.fn(),
    isScheduledLocally: true,
    scheduledAt: new Date("2026-08-01T09:00:00Z"),
    openScheduleModal: jest.fn(),
    confirmSchedule: jest.fn(),
    cancelSchedule: jest.fn(),
    primaryButtonLabel: () => "Confirm",
  };
}

describe("ScheduleFlowControls", () => {
  it("renders configurable scheduled-post actions", async () => {
    const publishNow = jest.fn();
    const saveAsDraft = jest.fn();

    render(
      <ScheduleFlowControls
        scheduleFlow={scheduleFlow()}
        primaryLabel="Confirm"
        scheduledPrimaryLabel="Save Changes"
        onPrimaryClick={jest.fn()}
        formattedTimePreferences={defaultFormattedTimePreferences}
        modalTitle="Schedule Discussion"
        testId="scheduled-post"
        showScheduleOption={false}
        options={[
          { label: "Publish now", action: publishNow, testId: "publish-now-option" },
          { label: "Save as draft", action: saveAsDraft, testId: "save-as-draft-option" },
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByTestId("scheduled-post-options"));

    expect(screen.queryByRole("menuitem", { name: "Schedule for later" })).not.toBeInTheDocument();

    await user.click(await screen.findByRole("menuitem", { name: "Publish now" }));
    expect(publishNow).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId("scheduled-post-options"));
    await user.click(await screen.findByRole("menuitem", { name: "Save as draft" }));
    expect(saveAsDraft).toHaveBeenCalledTimes(1);
  });
});
