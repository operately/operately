import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { DateField } from "../../DateField";
import type { Milestone } from "../types";
import { MilestoneViewSelector } from "./MilestoneViewSelector";
import { i18n, setupTestCatalog } from "../../../test/i18n";

setupTestCatalog();

jest.mock("../../icons", () => {
  const React = require("react");

  return new Proxy(
    {},
    {
      get: (_target, prop) => (props: Record<string, unknown>) =>
        React.createElement("svg", { ...props, "data-testid": `icon-${String(prop)}` }),
    },
  );
});

const createDate = (value: string): DateField.ContextualDate => ({
  date: new Date(`${value}T00:00:00Z`),
  dateType: "day",
  value,
});

const milestone: Milestone = {
  id: "website-launch",
  name: "Website launch",
  status: "pending",
  dueDate: createDate("2030-01-15"),
  link: "#",
};

const completedMilestone: Milestone = {
  id: "research-complete",
  name: "Research complete",
  status: "done",
  dueDate: createDate("2029-12-15"),
  link: "#",
};

const createdMilestone: Milestone = {
  id: "customer-onboarding",
  name: "Customer onboarding",
  status: "pending",
  dueDate: null,
  link: "#",
};

function renderSelector({ selectedMilestone = null }: { selectedMilestone?: Milestone | null } = {}) {
  const onChange = jest.fn();
  const onCreateMilestone = jest.fn(async () => ({ success: true, milestone: createdMilestone }));

  render(
    <MemoryRouter>
      <MilestoneViewSelector
        milestones={[milestone, completedMilestone]}
        selectedMilestone={selectedMilestone}
        canCreateMilestone
        onChange={onChange}
        onCreateMilestone={onCreateMilestone}
      />
    </MemoryRouter>,
  );

  return { onChange, onCreateMilestone };
}

function openSelector() {
  fireEvent.keyDown(screen.getByRole("button", { name: "Viewing tasks for All project tasks" }), { key: "Enter" });
}

describe("MilestoneViewSelector", () => {
  it("uses expanded catalog copy for the accessible trigger, menu and creation dialog", async () => {
    i18n.addResourceBundle(
      "en",
      "translation",
      {
        "Viewing tasks for {{milestone}}": "Expanded viewing label for {{milestone}}",
        "All project tasks": "All of the tasks in this project",
        "Create milestone": "Create a new milestone for this project",
        "Create Milestone": "Expanded milestone creation dialog",
        "Enter milestone name": "Enter a descriptive milestone name here",
      },
      true,
      true,
    );
    const { onChange } = renderSelector();
    fireEvent.keyDown(
      screen.getByRole("button", { name: "Expanded viewing label for All of the tasks in this project" }),
      { key: "Enter" },
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Create a new milestone for this project" }));
    const dialog = screen.getByRole("dialog", { name: "Expanded milestone creation dialog" });
    const input = within(dialog).getByPlaceholderText("Enter a descriptive milestone name here");
    fireEvent.change(input, { target: { value: "Customer onboarding" } });
    fireEvent.blur(input);
    fireEvent.click(within(dialog).getByRole("button", { name: "Create a new milestone for this project" }));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith("customer-onboarding"));
  });

  it("states what the board is viewing and offers milestone creation in the selector", () => {
    renderSelector();

    expect(screen.getByText("Viewing tasks for")).toBeInTheDocument();

    openSelector();

    expect(screen.getByRole("menuitem", { name: "All project tasks" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Website launch" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Create milestone" })).toBeInTheDocument();
  });

  it("shows milestone status icons in the menu and selected control", () => {
    renderSelector({ selectedMilestone: completedMilestone });

    const trigger = screen.getByRole("button", { name: "Viewing tasks for Research complete" });
    expect(within(trigger).getByTestId("icon-IconFlagFilled")).toBeInTheDocument();

    fireEvent.keyDown(trigger, { key: "Enter" });

    expect(
      within(screen.getByRole("menuitem", { name: "All project tasks" })).getByTestId("icon-IconList"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("menuitem", { name: "Website launch" })).getByTestId("icon-IconFlag"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("menuitem", { name: "Research complete" })).getByTestId("icon-IconFlagFilled"),
    ).toBeInTheDocument();
  });

  it("selects a newly created milestone after creation succeeds", async () => {
    const { onChange, onCreateMilestone } = renderSelector();

    openSelector();
    fireEvent.click(screen.getByRole("menuitem", { name: "Create milestone" }));

    const dialog = screen.getByRole("dialog");
    const nameInput = within(dialog).getByPlaceholderText("Enter milestone name");
    fireEvent.change(nameInput, {
      target: { value: "Customer onboarding" },
    });
    fireEvent.blur(nameInput);
    fireEvent.click(within(dialog).getByRole("button", { name: "Create milestone" }));

    expect(onCreateMilestone).toHaveBeenCalledWith(expect.objectContaining({ name: "Customer onboarding" }));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith("customer-onboarding"));
  });
});
