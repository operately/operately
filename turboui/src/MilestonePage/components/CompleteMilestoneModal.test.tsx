import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

import type * as Types from "../../TaskBoard/types";
import { CompleteMilestoneModal } from "./CompleteMilestoneModal";

const doneStatus: Types.Status = {
  id: "done",
  value: "done",
  label: "Done",
  color: "green",
  icon: "circleCheck",
  index: 0,
  closed: true,
};

describe("CompleteMilestoneModal", () => {
  it("moves open tasks to No milestone by default", async () => {
    const onComplete = jest.fn().mockResolvedValue(true);

    render(
      <CompleteMilestoneModal
        isOpen
        milestoneName="Beta launch"
        openTaskCount={2}
        closedStatuses={[doneStatus]}
        onClose={jest.fn()}
        onComplete={onComplete}
      />,
    );

    expect(document.querySelector('[data-test-id="resolutionAction-move_to_no_milestone"]')).toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: "Complete milestone" }));

    await waitFor(() => expect(onComplete).toHaveBeenCalledWith({ action: "move_to_no_milestone" }));
  });

  it("can change open tasks to a closed status", async () => {
    const onComplete = jest.fn().mockResolvedValue(true);

    render(
      <CompleteMilestoneModal
        isOpen
        milestoneName="Beta launch"
        openTaskCount={1}
        closedStatuses={[doneStatus]}
        onClose={jest.fn()}
        onComplete={onComplete}
      />,
    );

    fireEvent.click(await screen.findByLabelText("Change tasks to a closed status"));

    const statusSelector = document.querySelector('[data-test-id="complete-milestone-task-status"]');
    fireEvent.click(statusSelector!);

    const statusSearch = await screen.findByPlaceholderText("Change status...");
    expect(statusSearch.closest("[data-side]")).toHaveAttribute("data-side", "bottom");

    fireEvent.click(screen.getByRole("button", { name: "Complete milestone" }));

    await waitFor(() => expect(onComplete).toHaveBeenCalledWith({ action: "set_status", status: doneStatus }));
  });
});
