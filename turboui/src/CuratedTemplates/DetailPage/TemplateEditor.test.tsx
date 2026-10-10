import React from "react";
import { randomUUID } from "crypto";
import { render, fireEvent, screen, waitFor, within, configure } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TemplateEditor } from "./TemplateEditor";
import { templateFixture } from "../mockData";
import { i18n, setupTestCatalog } from "../../../test/i18n";

setupTestCatalog();

Object.defineProperty(globalThis.crypto, "randomUUID", { value: randomUUID, configurable: true });

configure({ testIdAttribute: "data-test-id" });

function setup(fail = false) {
  const onSave = jest
    .fn()
    .mockResolvedValue({ errors: fail ? [{ path: "definition.name", message: "Required" }] : [] });
  const result = render(<TemplateEditor template={templateFixture()} onSave={onSave} onCancel={jest.fn()} />);
  return { ...result, onSave };
}

test("translates template and milestone titles without using the job-title translation", async () => {
  await i18n.changeLanguage("pt-BR");
  setup();
  expect(screen.getByTestId("title")).toHaveAccessibleName(/^Título/);
  expect(screen.getByTestId("definition-milestones-0-title")).toHaveAccessibleName("Título");
  expect(i18n.t("Title")).toBe("Cargo");
});

test("adds and orders tasks, then submits the full definition", async () => {
  const { container, onSave } = setup();
  fireEvent.click(screen.getByTestId("add-template-task"));
  const field = container.querySelector('input[name="definition.tasks.1.name"]');
  expect(field).not.toBeNull();
  fireEvent.change(field as Element, { target: { value: "Second task" } });
  const rows = screen.getAllByTestId("template-child-row");
  fireEvent.click(within(rows[2] as HTMLElement).getByRole("button", { name: "Move up" }));
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  const definition = JSON.parse(onSave.mock.calls[0][0].definition);
  expect(definition.tasks.map((task: { name: string }) => task.name)).toEqual([
    "Second task",
    "Write the welcome guide",
  ]);
  expect(definition.milestones).toHaveLength(1);
});

test("removing a milestone retains its tasks without a milestone reference", async () => {
  const { onSave } = setup();
  const row = screen.getAllByTestId("template-child-row")[0] as HTMLElement;
  fireEvent.click(within(row).getByRole("button", { name: "Remove" }));
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  const definition = JSON.parse(onSave.mock.calls[0][0].definition);
  expect(definition.milestones).toEqual([]);
  expect(definition.tasks[0].milestone_key).toBeNull();
});

test("failed validation retains edits and presents field errors", async () => {
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    const { container } = setup(true);
    const field = container.querySelector('input[name="title"]') as Element;
    fireEvent.change(field, { target: { value: "Keep this change" } });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() => expect(screen.getByTestId("template-errors")).toBeInTheDocument());
    expect(field).toHaveValue("Keep this change");
    expect(field).toHaveAttribute("aria-invalid", "true");
  } finally {
    log.mockRestore();
  }
});

test("publish submits the current unsaved content", async () => {
  const { onSave } = setup();
  fireEvent.change(screen.getByTestId("title"), { target: { value: "New content" } });
  fireEvent.click(screen.getByTestId("publish-template"));
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  expect(onSave.mock.calls[0][1]).toBe("publish");
  expect(JSON.parse(onSave.mock.calls[0][0].definition).name).toBe("New content");
});

test("saving a draft does not publish it", async () => {
  const { onSave } = setup();
  fireEvent.click(screen.getByTestId("submit"));
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  expect(onSave.mock.calls[0][1]).toBe("draft");
});

test("new templates can be published directly", async () => {
  const onSave = jest.fn().mockResolvedValue({ errors: [] });
  render(<TemplateEditor onSave={onSave} onCancel={jest.fn()} />);
  fireEvent.change(screen.getByTestId("title"), { target: { value: "New template" } });
  fireEvent.click(screen.getByTestId("publish-template"));
  await waitFor(() =>
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: "New template" }), "publish"),
  );
});

test("published templates update live content without offering a draft action", async () => {
  const onSave = jest.fn().mockResolvedValue({ errors: [] });
  const onCancel = jest.fn();
  render(
    <TemplateEditor template={{ ...templateFixture(), state: "published" }} onSave={onSave} onCancel={onCancel} />,
  );
  expect(screen.queryByRole("button", { name: "Save draft" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByTestId("submit"));
  await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.anything(), "publish"));
  await waitFor(() => expect(screen.getByTestId("cancel-template")).toBeEnabled());
  fireEvent.click(screen.getByTestId("cancel-template"));
  expect(onCancel).toHaveBeenCalledTimes(1);
});

function selectType(label: string) {
  fireEvent.keyDown(within(screen.getByTestId("type")).getByRole("combobox"), { key: "ArrowDown" });
  fireEvent.click(screen.getByRole("option", { name: label }));
}

test("switching types retains shared fields and each type's hidden content", async () => {
  const { onSave } = setup();
  fireEvent.change(screen.getByTestId("title"), { target: { value: "Shared title" } });
  fireEvent.change(screen.getByTestId("definition-milestones-0-title"), { target: { value: "First milestone" } });
  fireEvent.change(screen.getByTestId("definition-tasks-0-name"), { target: { value: "First task" } });

  selectType("KPI");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.queryByTestId("definition-milestones-0-title")).not.toBeInTheDocument();
  expect(screen.getByTestId("title")).toHaveValue("Shared title");
  fireEvent.change(screen.getByTestId("definition-unit"), { target: { value: "%" } });

  selectType("Goal");
  expect(screen.queryByTestId("definition-unit")).not.toBeInTheDocument();
  fireEvent.change(screen.getByTestId("definition-duration-days"), { target: { value: "45" } });
  fireEvent.click(screen.getByTestId("add-template-target"));
  fireEvent.change(screen.getByTestId("definition-targets-0-name"), { target: { value: "First target" } });

  selectType("Project");
  expect(screen.getByTestId("definition-milestones-0-title")).toHaveValue("First milestone");
  expect(screen.getByTestId("definition-tasks-0-name")).toHaveValue("First task");
  expect(screen.getByTestId("definition-duration-days")).toHaveValue(45);
  expect(screen.queryByTestId("definition-targets-0-name")).not.toBeInTheDocument();

  selectType("Goal");
  expect(screen.getByTestId("definition-targets-0-name")).toHaveValue("First target");
  selectType("KPI");
  expect(screen.getByTestId("definition-unit")).toHaveValue("%");
  fireEvent.click(screen.getByTestId("submit"));
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  expect(JSON.parse(onSave.mock.calls[0][0].definition)).toEqual({
    name: "Shared title",
    description: null,
    unit: "%",
    cadence: null,
  });
});

test("saving another type keeps hidden values", async () => {
  const onSave = jest.fn().mockResolvedValue({ errors: [] });
  const template = templateFixture("project");
  const props = { template, onSave, onCancel: jest.fn() };
  const { rerender } = render(<TemplateEditor {...props} />);
  fireEvent.change(screen.getByTestId("definition-milestones-0-title"), { target: { value: "Keep this milestone" } });
  selectType("KPI");
  fireEvent.click(screen.getByTestId("submit"));
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  rerender(
    <TemplateEditor
      {...props}
      template={{ ...template, ...onSave.mock.calls[0][0], updatedAt: "2026-10-10T12:00:00Z" }}
    />,
  );
  selectType("Project");
  expect(screen.getByTestId("definition-milestones-0-title")).toHaveValue("Keep this milestone");
});

test.each(["kpi", "goal", "project"] as const)("uses the title as the saved %s resource name", async (type) => {
  const onSave = jest.fn().mockResolvedValue({ errors: [] });
  render(<TemplateEditor template={templateFixture(type)} onSave={onSave} onCancel={jest.fn()} />);
  expect(screen.queryByTestId("definition-name")).not.toBeInTheDocument();
  fireEvent.change(screen.getByTestId("title"), { target: { value: "One title" } });
  fireEvent.click(screen.getByTestId("submit"));
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  expect(onSave.mock.calls[0][0].title).toBe("One title");
  expect(JSON.parse(onSave.mock.calls[0][0].definition).name).toBe("One title");
});
