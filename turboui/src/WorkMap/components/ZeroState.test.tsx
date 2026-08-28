import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { MemoryRouter } from "react-router";

import { ZeroState } from "./ZeroState";

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
const spaceSearch = jest.fn().mockResolvedValue([generalSpace]);
const templates = [{ id: "tpl-general", name: "General campaign", spaceId: "general" }];

function renderFirstProjectState(
  addItem = jest.fn().mockResolvedValue({ id: "project-1" }),
  onItemCreated = jest.fn(),
  options: { projectTemplates?: typeof templates } = {},
) {
  render(
    <MemoryRouter>
      <ZeroState
        addingEnabled
        addItem={addItem}
        spaceSearch={spaceSearch}
        addItemDefaultSpace={generalSpace}
        variant="first-project"
        onItemCreated={onItemCreated}
        projectTemplates={options.projectTemplates ?? templates}
      />
    </MemoryRouter>,
  );

  return { addItem, onItemCreated };
}

describe("Work Map first-project state", () => {
  it("focuses the hierarchy on creating a project", () => {
    renderFirstProjectState();

    expect(screen.getByRole("heading", { name: "Add your first project" })).toBeInTheDocument();
    expect(screen.getByLabelText("Project name")).toHaveAttribute("placeholder", "e.g. Launch the new website");
    expect(screen.getByRole("button", { name: "Create project" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add a goal" })).toBeInTheDocument();
  });

  it("gives the project form the full onboarding column width", () => {
    renderFirstProjectState();

    const form = document.querySelector('[data-test-id="first-project-form"]');

    expect(form).toHaveClass("w-full");
    expect(form?.parentElement).toHaveClass("max-w-sm");
  });

  it("creates the project in General and reports the created item", async () => {
    const user = userEvent.setup();
    const { addItem, onItemCreated } = renderFirstProjectState();

    await user.type(screen.getByLabelText("Project name"), "Launch customer portal");
    await user.click(screen.getByRole("button", { name: "Create project" }));

    await waitFor(() => {
      expect(addItem).toHaveBeenCalledWith({
        name: "Launch customer portal",
        type: "project",
        space: generalSpace,
        parentId: null,
        accessLevels: { company: "edit", space: "edit" },
      });
      expect(onItemCreated).toHaveBeenCalledWith("project", "project-1");
    });
  });

  it("keeps the submission loading while navigation starts", async () => {
    const user = userEvent.setup();
    const { onItemCreated } = renderFirstProjectState();
    const submitButton = screen.getByRole("button", { name: "Create project" });

    await user.type(screen.getByLabelText("Project name"), "Launch customer portal");
    await user.click(submitButton);

    await waitFor(() => expect(onItemCreated).toHaveBeenCalled());
    expect(submitButton).toBeDisabled();
  });

  it("requires a project name", async () => {
    const user = userEvent.setup();
    const { addItem } = renderFirstProjectState();

    await user.click(screen.getByRole("button", { name: "Create project" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Enter a project name.");
    expect(addItem).not.toHaveBeenCalled();
  });

  it("keeps goal creation available as the secondary path", async () => {
    const user = userEvent.setup();
    const { addItem, onItemCreated } = renderFirstProjectState();

    await user.click(screen.getByRole("button", { name: "Add a goal" }));

    expect(screen.getByRole("heading", { name: "Add goal" })).toBeInTheDocument();
    expect(screen.getByText("General")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("e.g. Increase user acquisition"), "Improve customer retention");
    const submitButton = screen.getByRole("button", { name: "Add Goal" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(addItem).toHaveBeenCalledWith({
        name: "Improve customer retention",
        type: "goal",
        space: generalSpace,
        parentId: null,
        accessLevels: { company: "edit", space: "edit" },
      });
      expect(onItemCreated).toHaveBeenCalledWith("goal", "project-1");
    });
    expect(submitButton).toBeDisabled();
  });

  it("shows the template picker when project templates are enabled", () => {
    renderFirstProjectState(undefined, undefined);

    expect(screen.getByLabelText("Template")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "General campaign" })).toBeInTheDocument();
  });

  it("passes templateId and startDate when creating from a template", async () => {
    const user = userEvent.setup();
    const { addItem } = renderFirstProjectState(undefined, undefined);

    await user.type(screen.getByLabelText("Project name"), "Launch customer portal");
    fireEvent.change(screen.getByLabelText("Template"), { target: { value: "tpl-general" } });
    selectCurrentDate("Project start date");
    await user.click(screen.getByRole("button", { name: "Create project" }));

    await waitFor(() => {
      expect(addItem).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Launch customer portal",
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
