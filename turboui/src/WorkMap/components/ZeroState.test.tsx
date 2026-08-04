import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { MemoryRouter } from "react-router";

import { ZeroState } from "./ZeroState";

const generalSpace = { id: "general", name: "General", link: "/spaces/general" };
const spaceSearch = jest.fn().mockResolvedValue([generalSpace]);

function renderFirstProjectState(
  addItem = jest.fn().mockResolvedValue({ id: "project-1" }),
  onItemCreated = jest.fn(),
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
});
