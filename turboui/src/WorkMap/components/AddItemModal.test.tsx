import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import { AddItemModal } from "./AddItemModal";

jest.mock("react-select", () => {
  return function MockSelect({
    options,
    value,
    onChange,
  }: {
    options: { label: string; value: string }[];
    value?: { label: string; value: string };
    onChange: (option: { label: string; value: string } | null) => void;
  }) {
    return (
      <select
        aria-label="Template"
        value={value?.value ?? ""}
        onChange={(event) => onChange(options.find((option) => option.value === event.target.value) ?? null)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  };
});

const generalSpace = { id: "general", name: "General", link: "/spaces/general" };
const templates = [
  { id: "tpl-general", name: "General campaign", spaceId: "general" },
  { id: "tpl-other", name: "Other space template", spaceId: "other" },
];

describe("AddItemModal", () => {
  it("stops submitting when validation fails", async () => {
    const user = userEvent.setup();
    const save = jest.fn();

    render(
      <AddItemModal
        isOpen
        close={jest.fn()}
        parentGoal={null}
        spaceSearch={jest.fn().mockResolvedValue([generalSpace])}
        save={save}
        space={generalSpace}
      />,
    );

    const submitButton = screen.getByRole("button", { name: "Add Goal" });
    await user.click(submitButton);

    expect(await screen.findByText("Cannot be empty")).toBeInTheDocument();
    expect(submitButton).toBeEnabled();
    expect(save).not.toHaveBeenCalled();
  });

  it("hides templates when the type is goal", () => {
    render(
      <AddItemModal
        isOpen
        close={jest.fn()}
        parentGoal={null}
        spaceSearch={jest.fn().mockResolvedValue([generalSpace])}
        save={jest.fn()}
        space={generalSpace}
        projectTemplatesEnabled
        templates={templates}
      />,
    );

    expect(screen.queryByLabelText("Template")).not.toBeInTheDocument();
  });

  it("shows space-filtered templates when the type is project", async () => {
    const user = userEvent.setup();

    render(
      <AddItemModal
        isOpen
        close={jest.fn()}
        parentGoal={null}
        spaceSearch={jest.fn().mockResolvedValue([generalSpace])}
        save={jest.fn()}
        space={generalSpace}
        projectTemplatesEnabled
        templates={templates}
      />,
    );

    await user.click(screen.getByText("Project", { selector: "span.font-medium" }));

    expect(screen.getByLabelText("Template")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "General campaign" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Other space template" })).not.toBeInTheDocument();
  });

  it("requires a start date when a template is selected", async () => {
    const user = userEvent.setup();
    const save = jest.fn();

    render(
      <AddItemModal
        isOpen
        close={jest.fn()}
        parentGoal={null}
        spaceSearch={jest.fn().mockResolvedValue([generalSpace])}
        save={save}
        space={generalSpace}
        initialItemType="project"
        hideTypeSelector
        projectTemplatesEnabled
        templates={templates}
      />,
    );

    await user.type(screen.getByPlaceholderText("e.g. Implement new website design"), "Launch portal");
    fireEvent.change(screen.getByLabelText("Template"), { target: { value: "tpl-general" } });
    await user.click(screen.getByRole("button", { name: "Add Project" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Select a project start date.");
    expect(save).not.toHaveBeenCalled();
  });

  it("passes templateId and startDate when creating from a template", async () => {
    const user = userEvent.setup();
    const save = jest.fn().mockResolvedValue({ id: "project-1" });

    render(
      <AddItemModal
        isOpen
        close={jest.fn()}
        parentGoal={null}
        spaceSearch={jest.fn().mockResolvedValue([generalSpace])}
        save={save}
        space={generalSpace}
        initialItemType="project"
        hideTypeSelector
        projectTemplatesEnabled
        templates={templates}
      />,
    );

    await user.type(screen.getByPlaceholderText("e.g. Implement new website design"), "Launch portal");
    fireEvent.change(screen.getByLabelText("Template"), { target: { value: "tpl-general" } });
    selectCurrentDate("Project start date");
    await user.click(screen.getByRole("button", { name: "Add Project" }));

    await waitFor(() => {
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Launch portal",
          type: "project",
          templateId: "tpl-general",
          startDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        }),
      );
    });
  });
});

function selectCurrentDate(label: string) {
  const date = new Date();
  const isoDate = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

  fireEvent.click(screen.getByLabelText(label));

  const day = document.querySelector(`[data-date="${isoDate}"]`);
  if (!day) throw new Error(`Could not find calendar day ${isoDate}`);

  fireEvent.click(day);
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
}
