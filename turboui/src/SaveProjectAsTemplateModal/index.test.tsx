import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { defaultFormattedTimePreferences } from "../FormattedTime";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { SaveProjectAsTemplateModal } from ".";

function renderModal(overrides: Partial<SaveProjectAsTemplateModal.Props> = {}) {
  const props: SaveProjectAsTemplateModal.Props = {
    isOpen: true,
    onClose: jest.fn(),
    projectName: "Launch project",
    projectDescription: { type: "doc", content: [] },
    richTextHandlers: createMockRichEditorHandlers(),
    formattedTimePreferences: defaultFormattedTimePreferences,
    submissionEnabled: false,
    onSave: jest.fn().mockResolvedValue({ success: true }),
    ...overrides,
  };

  return {
    props,
    ...render(
      <MemoryRouter>
        <SaveProjectAsTemplateModal {...props} />
      </MemoryRouter>,
    ),
  };
}

describe("SaveProjectAsTemplateModal", () => {
  it("shows source defaults, include defaults, and the disabled rollout state", () => {
    renderModal();

    expect(screen.getByRole("textbox", { name: /Template name/ })).toHaveValue("Launch project");
    expect(screen.getByLabelText("People and assignments")).not.toBeChecked();
    expect(screen.getByLabelText("Discussions")).toBeChecked();
    expect(screen.getByLabelText("Comments")).not.toBeChecked();
    expect(screen.getByLabelText("Docs & Files")).toBeChecked();
    expect(screen.getByText("Include")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save as template" })).toBeDisabled();
  });

  it("retains form values and renders every linked schedule issue", async () => {
    const onSave = jest.fn().mockResolvedValue({
      success: false,
      scheduleIssues: [
        {
          resourceType: "milestone",
          resourceId: "milestone-1",
          resourceName: "Release",
          field: "due_date",
          date: "2028-01-09",
          reason: "before_project_start",
          link: "/milestones/milestone-1",
        },
        {
          resourceType: "task",
          resourceId: "task-1",
          resourceName: "Announce",
          field: "due_date",
          date: "2028-01-08",
          reason: "before_project_start",
          link: "/tasks/task-1",
        },
      ],
    });
    renderModal({ submissionEnabled: true, onSave });

    fireEvent.change(screen.getByRole("textbox", { name: /Template name/ }), { target: { value: "Reusable launch" } });
    fireEvent.click(screen.getByRole("button", { name: "Save as template" }));

    await waitFor(() => expect(screen.getByText("Some dates are before the project start date.")).toBeInTheDocument());
    expect(screen.getByRole("link", { name: "Release" })).toHaveAttribute("href", "/milestones/milestone-1");
    expect(screen.getByRole("link", { name: "Announce" })).toHaveAttribute("href", "/tasks/task-1");
    expect(screen.getByRole("textbox", { name: /Template name/ })).toHaveValue("Reusable launch");
  });

  it("clears failures before retry and closes only after success", async () => {
    const onClose = jest.fn();
    const onSave = jest
      .fn()
      .mockResolvedValueOnce({ success: false, error: "The template could not be created." })
      .mockResolvedValueOnce({ success: true });
    renderModal({ submissionEnabled: true, onSave, onClose });

    fireEvent.click(screen.getByRole("button", { name: "Save as template" }));
    await screen.findByText("The template could not be created.");
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Save as template" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("resets and closes on cancellation", () => {
    const { props } = renderModal();
    fireEvent.change(screen.getByRole("textbox", { name: /Template name/ }), { target: { value: "Changed" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
