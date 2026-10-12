import React from "react";
import { configure, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";
import { defaultFormattedTimePreferences } from "../../FormattedTime";
import { templateFixture } from "../mockData";
import { CuratedTemplatePreviewPage } from "./index";
import type { CuratedTemplate, TemplateType } from "../types";

jest.mock("@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box", () => ({ DropIndicator: () => null }));

configure({ testIdAttribute: "data-test-id" });

function setup(type: TemplateType, overrides: Partial<CuratedTemplate> = {}, tab = "overview") {
  return render(
    <MemoryRouter initialEntries={[`/preview?tab=${tab}`]}>
      <CuratedTemplatePreviewPage
        template={{ ...templateFixture(type), ...overrides }}
        editorPath="/editor"
        referenceDate="2026-10-12"
        formattedTimePreferences={defaultFormattedTimePreferences}
      />
    </MemoryRouter>,
  );
}

test.each(["kpi", "goal", "project"] as const)("renders a read-only %s preview", (type) => {
  const { container } = setup(type);
  expect(screen.getByTestId("back-to-template-editor")).toHaveAttribute("href", "/editor");
  expect(screen.getAllByText(templateFixture(type).title).length).toBeGreaterThan(0);
  expect(container.querySelector('input, textarea, [contenteditable="true"], [draggable="true"]')).toBeNull();
  expect(screen.queryByTestId("project-subscribe-button")).not.toBeInTheDocument();
  expect(screen.queryByTestId("chart-log-update")).not.toBeInTheDocument();
});

test.each(["kpi", "goal", "project"] as const)("renders incomplete %s drafts without crashing", (type) => {
  setup(type, { definition: "{}" });
  expect(screen.getByTestId("template-preview")).toBeInTheDocument();
  expect(screen.getByTestId("preview-incomplete")).toBeInTheDocument();
});

test("project tasks can be inspected without creation, editing, or dragging", async () => {
  const { container } = setup("project", {}, "tasks");
  expect(screen.getByTestId("tasks-board")).toBeInTheDocument();
  expect(screen.queryByTestId("milestone-add-task")).not.toBeInTheDocument();
  expect(container.querySelector('[draggable="true"]')).toBeNull();
  fireEvent.click(screen.getByTestId("task-title-guide"));
  const task = await screen.findByTestId("task-slide-in");
  expect(within(task).queryByRole("textbox")).not.toBeInTheDocument();
  expect(within(task).getAllByText("Write the welcome guide").length).toBeGreaterThan(0);
});

test("goal target details expand without editing or reordering controls", () => {
  const { container } = setup("goal");
  const target = screen.getByTestId("target-reduce-churn");
  fireEvent.click(within(target).getByText("Reduce churn"));
  expect(within(target).queryByRole("textbox")).not.toBeInTheDocument();
  expect(container.querySelector('[draggable="true"]')).toBeNull();
  expect(within(target).queryByTestId("edit-target-reduce-churn")).not.toBeInTheDocument();
});

test("project board view is read-only", () => {
  const { container } = setup("project", {}, "tasks&taskDisplay=board");
  expect(screen.getAllByText("Write the welcome guide").length).toBeGreaterThan(0);
  expect(container.querySelector('[draggable="true"], [contenteditable="true"]')).toBeNull();
  expect(screen.queryByTestId("add-task")).not.toBeInTheDocument();
});

test.each(["kpi", "goal", "project"] as const)("renders %s descriptions as formatted rich text", (type) => {
  const description = {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "Release checklist", marks: [{ type: "bold" }] }] }],
  };
  const definition = { ...JSON.parse(templateFixture(type).definition ?? "{}"), description };
  setup(type, { definition: JSON.stringify(definition) });
  expect(screen.getByText("Release checklist").tagName).toBe("STRONG");
  expect(screen.queryByText(JSON.stringify(description))).not.toBeInTheDocument();
  expect(screen.queryByTestId("preview-reference-date")).not.toBeInTheDocument();
});
