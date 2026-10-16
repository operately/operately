import React from "react";
import { randomUUID } from "crypto";
import { MemoryRouter } from "react-router";
import { render as renderComponent, fireEvent, screen, waitFor, within, configure } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TemplateEditor } from "./TemplateEditor";
import { showSuccessToast } from "../../Toasts";
import { templateFixture } from "../mockData";
import { i18n, setupTestCatalog } from "../../../test/i18n";

jest.mock("../../Toasts", () => ({ showSuccessToast: jest.fn() }));
beforeEach(() => jest.clearAllMocks());

setupTestCatalog();

Object.defineProperty(globalThis.crypto, "randomUUID", { value: randomUUID, configurable: true });

configure({ testIdAttribute: "data-test-id" });

function render(ui: React.ReactElement) {
  return renderComponent(ui, { wrapper: MemoryRouter });
}

test("changing a saved draft's type clears its incompatible example data", async () => {
  const onSave = jest.fn().mockResolvedValue({ errors: [] });
  render(
    <TemplateEditor
      template={{
        ...templateFixture("kpi"),
        previewData: JSON.stringify({ entries: [{ period_offset: -1, value: 10 }] }),
      }}
      onSave={onSave}
      onCancel={jest.fn()}
    />,
  );
  selectType("goal");
  fireEvent.click(screen.getByTestId("save-template-draft"));
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  expect(onSave.mock.calls[0][0].previewData).toBe("{}");
  expect(showSuccessToast).toHaveBeenCalledWith("Success", "The template has been saved.");
});

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
  expect(i18n.t("Title", { context: "person" })).toBe("Cargo");
});

test("adds and orders tasks, then submits the full definition", async () => {
  const { container, onSave } = setup();
  fireEvent.click(screen.getByTestId("add-template-task"));
  const field = container.querySelector('input[name="definition.tasks.1.name"]');
  expect(field).not.toBeNull();
  fireEvent.change(field as Element, { target: { value: "Second task" } });
  const rows = screen.getAllByTestId("template-child-row");
  fireEvent.click(within(rows[2] as HTMLElement).getByTestId("move-child-up"));
  fireEvent.click(screen.getByTestId("save-template-draft"));
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
  fireEvent.click(within(row).getByTestId("remove-child"));
  fireEvent.click(screen.getByTestId("save-template-draft"));
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
    fireEvent.click(screen.getByTestId("save-template-draft"));
    await waitFor(() => expect(screen.getByTestId("template-errors")).toBeInTheDocument());
    expect(field).toHaveValue("Keep this change");
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(showSuccessToast).not.toHaveBeenCalled();
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
  expect(showSuccessToast).toHaveBeenCalledWith("Success", "The template has been saved.");
});

test("saving a draft does not publish it", async () => {
  const { onSave } = setup();
  fireEvent.click(screen.getByTestId("save-template-draft"));
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  expect(onSave.mock.calls[0][1]).toBe("draft");
});

test("new templates can be published directly", async () => {
  const onSave = jest.fn().mockResolvedValue({ errors: [] });
  render(<TemplateEditor onSave={onSave} onCancel={jest.fn()} />);
  fireEvent.change(screen.getByTestId("title"), { target: { value: "New template" } });
  fireEvent.blur(screen.getByTestId("title"));
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
  expect(screen.queryByTestId("save-template-draft")).not.toBeInTheDocument();
  fireEvent.click(screen.getByTestId("update-template"));
  await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.anything(), "publish"));
  await waitFor(() => expect(screen.getByTestId("cancel-template")).toBeEnabled());
  expect(showSuccessToast).toHaveBeenCalledWith("Success", "The template has been saved.");
  fireEvent.click(screen.getByTestId("cancel-template"));
  expect(onCancel).toHaveBeenCalledTimes(1);
});

function selectType(type: "kpi" | "goal" | "project") {
  fireEvent.keyDown(within(screen.getByTestId("type")).getByRole("combobox"), { key: "ArrowDown" });
  fireEvent.click(screen.getByTestId(`type-option-${type}`));
}

test("switching types retains shared fields and each type's hidden content", async () => {
  const { onSave } = setup();
  fireEvent.change(screen.getByTestId("title"), { target: { value: "Shared title" } });
  fireEvent.change(screen.getByTestId("definition-milestones-0-title"), { target: { value: "First milestone" } });
  fireEvent.change(screen.getByTestId("definition-tasks-0-name"), { target: { value: "First task" } });

  selectType("kpi");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.queryByTestId("definition-milestones-0-title")).not.toBeInTheDocument();
  expect(screen.getByTestId("title")).toHaveValue("Shared title");
  fireEvent.change(screen.getByTestId("definition-unit"), { target: { value: "%" } });

  selectType("goal");
  expect(screen.queryByTestId("definition-unit")).not.toBeInTheDocument();
  fireEvent.change(screen.getByTestId("definition-duration-days"), { target: { value: "45" } });
  fireEvent.click(screen.getByTestId("add-template-target"));
  fireEvent.change(screen.getByTestId("definition-targets-0-name"), { target: { value: "First target" } });

  selectType("project");
  expect(screen.getByTestId("definition-milestones-0-title")).toHaveValue("First milestone");
  expect(screen.getByTestId("definition-tasks-0-name")).toHaveValue("First task");
  expect(screen.getByTestId("definition-duration-days")).toHaveValue(45);
  expect(screen.queryByTestId("definition-targets-0-name")).not.toBeInTheDocument();

  selectType("goal");
  expect(screen.getByTestId("definition-targets-0-name")).toHaveValue("First target");
  selectType("kpi");
  expect(screen.getByTestId("definition-unit")).toHaveValue("%");
  fireEvent.click(screen.getByTestId("save-template-draft"));
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
  selectType("kpi");
  fireEvent.click(screen.getByTestId("save-template-draft"));
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  rerender(
    <TemplateEditor
      {...props}
      template={{ ...template, ...onSave.mock.calls[0][0], updatedAt: "2026-10-10T12:00:00Z" }}
    />,
  );
  selectType("project");
  expect(screen.getByTestId("definition-milestones-0-title")).toHaveValue("Keep this milestone");
});

test.each(["kpi", "goal", "project"] as const)("uses the title as the saved %s resource name", async (type) => {
  const onSave = jest.fn().mockResolvedValue({ errors: [] });
  render(<TemplateEditor template={templateFixture(type)} onSave={onSave} onCancel={jest.fn()} />);
  expect(screen.queryByTestId("definition-name")).not.toBeInTheDocument();
  fireEvent.change(screen.getByTestId("title"), { target: { value: "One title" } });
  fireEvent.click(screen.getByTestId("save-template-draft"));
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  expect(onSave.mock.calls[0][0].title).toBe("One title");
  expect(JSON.parse(onSave.mock.calls[0][0].definition).name).toBe("One title");
});

test.each(["draft", "published"] as const)("submits decimal targets from a %s template", async (state) => {
  const onSave = jest.fn().mockResolvedValue({ errors: [] });
  render(<TemplateEditor template={{ ...templateFixture("goal"), state }} onSave={onSave} onCancel={jest.fn()} />);

  const baseline = screen.getByTestId("definition-targets-0-from");
  baseline.focus();
  fireEvent.change(baseline, { target: { value: "1.5" } });
  expect(baseline).toBeValid();

  const target = screen.getByTestId("definition-targets-0-to");
  target.focus();
  fireEvent.change(target, { target: { value: "2.75" } });
  expect(target).toBeValid();

  fireEvent.click(screen.getByTestId(state === "draft" ? "publish-template" : "update-template"));
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  expect(onSave.mock.calls[0][1]).toBe("publish");
  expect(JSON.parse(onSave.mock.calls[0][0].definition).targets[0]).toMatchObject({ from: 1.5, to: 2.75 });
});

test("generates a slug on title blur until it is edited manually", () => {
  render(<TemplateEditor onSave={jest.fn()} onCancel={jest.fn()} />);
  fireEvent.change(screen.getByTestId("title"), { target: { value: "Monthly Website Visitors" } });
  expect(screen.getByTestId("slug")).toHaveValue("");
  fireEvent.blur(screen.getByTestId("title"));
  expect(screen.getByTestId("slug")).toHaveValue("monthly-website-visitors");
  fireEvent.change(screen.getByTestId("title"), { target: { value: "Inscrições mensais!" } });
  expect(screen.getByTestId("slug")).toHaveValue("monthly-website-visitors");
  fireEvent.blur(screen.getByTestId("title"));
  expect(screen.getByTestId("slug")).toHaveValue("inscricoes-mensais");
  fireEvent.change(screen.getByTestId("slug"), { target: { value: "website-signups" } });
  fireEvent.change(screen.getByTestId("title"), { target: { value: "Another title" } });
  fireEvent.blur(screen.getByTestId("title"));
  expect(screen.getByTestId("slug")).toHaveValue("website-signups");
});

test("preserves an existing slug when renaming and saves an edited slug", async () => {
  const { onSave } = setup();
  const slug = screen.getByTestId("slug");
  const original = (slug as HTMLInputElement).value;
  fireEvent.change(screen.getByTestId("title"), { target: { value: "New title" } });
  fireEvent.blur(screen.getByTestId("title"));
  expect(slug).toHaveValue(original);
  fireEvent.change(slug, { target: { value: "custom-slug" } });
  fireEvent.click(screen.getByTestId("save-template-draft"));
  await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ slug: "custom-slug" }), "draft"));
});

test("failed saves retain example edits and show the returned field error", async () => {
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    const onSave = jest
      .fn()
      .mockResolvedValue({ errors: [{ path: "preview_data.entries.0.value", message: "Invalid measurement" }] });
    const template = {
      ...templateFixture("kpi"),
      previewData: JSON.stringify({ entries: [{ period_offset: -1, value: 10 }] }),
    };
    render(<TemplateEditor template={template} onSave={onSave} onCancel={jest.fn()} />);
    fireEvent.change(screen.getByTestId("title"), { target: { value: "Keep this title" } });
    fireEvent.click(screen.getByTestId("tab-example-data"));
    fireEvent.change(screen.getByTestId("preview-data-entries-0-value"), { target: { value: "25" } });
    fireEvent.click(screen.getByTestId("tab-template"));
    fireEvent.click(screen.getByTestId("save-template-draft"));
    expect(await screen.findByTestId("template-errors")).toBeVisible();
    expect(screen.getByTestId("preview-data-entries-0-value")).toHaveValue(25);
    expect(screen.getByTestId("template-errors")).toHaveTextContent("Invalid measurement");
    expect(screen.getByTestId("preview-data-entries-0-value")).toBeVisible();
    fireEvent.click(screen.getByTestId("tab-template"));
    expect(screen.getByTestId("title")).toHaveValue("Keep this title");
    expect(showSuccessToast).not.toHaveBeenCalled();
  } finally {
    log.mockRestore();
  }
});

test("updates a published KPI with edited measurements and removed annotations", async () => {
  const onSave = jest.fn().mockResolvedValue({ errors: [] });
  const template = {
    ...templateFixture("kpi"),
    state: "published" as const,
    previewData: JSON.stringify({
      entries: [{ period_offset: -1, value: 12 }],
      annotations: [{ period_offset: -1, title: "Campaign" }],
    }),
  };
  render(<TemplateEditor template={template} onSave={onSave} onCancel={jest.fn()} />);
  fireEvent.click(screen.getByTestId("tab-example-data"));
  fireEvent.change(screen.getByTestId("preview-data-entries-0-value"), { target: { value: "15.5" } });
  fireEvent.click(screen.getByTestId("remove-preview-annotation-0"));
  fireEvent.click(screen.getByTestId("update-template"));
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  expect(showSuccessToast).toHaveBeenCalledWith("Success", "The template has been saved.");
  const saved = onSave.mock.calls[0][0].previewData;
  expect(JSON.parse(saved)).toEqual({ entries: [{ period_offset: -1, value: 15.5 }], annotations: [] });
});

test("creates a template together with example data", async () => {
  const onSave = jest.fn().mockResolvedValue({ errors: [] });
  render(<TemplateEditor onSave={onSave} onCancel={jest.fn()} />);
  fireEvent.change(screen.getByTestId("title"), { target: { value: "New KPI" } });
  fireEvent.blur(screen.getByTestId("title"));
  fireEvent.click(screen.getByTestId("tab-example-data"));
  fireEvent.click(screen.getByTestId("add-preview-entry"));
  fireEvent.change(screen.getByTestId("preview-data-entries-0-value"), { target: { value: "416" } });
  fireEvent.change(screen.getByTestId("preview-data-entries-0-period-offset"), { target: { value: "-3" } });
  fireEvent.click(screen.getByTestId("publish-template"));
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  expect(JSON.parse(onSave.mock.calls[0][0].previewData).entries).toEqual([{ period_offset: -3, value: 416 }]);
});

test.each(["client", "native", "server"])(
  "%s validation reveals errors in the hidden template tab",
  async (validation) => {
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      const onSave = jest.fn().mockResolvedValue({ errors: [{ path: "title", message: "Invalid title" }] });
      render(<TemplateEditor template={templateFixture("kpi")} onSave={onSave} onCancel={jest.fn()} />);
      fireEvent.change(screen.getByTestId("title"), {
        target: { value: validation === "server" ? "Edited title" : "" },
      });
      fireEvent.click(screen.getByTestId("tab-example-data"));
      fireEvent.click(screen.getByTestId("add-preview-entry"));
      fireEvent.change(screen.getByTestId("preview-data-entries-0-value"), { target: { value: "25" } });
      fireEvent.click(screen.getByTestId(validation === "native" ? "publish-template" : "save-template-draft"));
      await waitFor(() => expect(screen.getByTestId("title")).toBeVisible());
      expect(screen.getByTestId("template-errors")).toBeVisible();
      expect(onSave).toHaveBeenCalledTimes(validation === "server" ? 1 : 0);
      fireEvent.click(screen.getByTestId("tab-example-data"));
      expect(screen.getByTestId("preview-data-entries-0-value")).toHaveValue(25);
    } finally {
      log.mockRestore();
    }
  },
);

test("native validation reveals an invalid annotation in the hidden example data tab", async () => {
  const onSave = jest.fn();
  render(<TemplateEditor template={templateFixture("kpi")} onSave={onSave} onCancel={jest.fn()} />);
  fireEvent.click(screen.getByTestId("tab-example-data"));
  fireEvent.click(screen.getByTestId("add-preview-annotation"));
  fireEvent.click(screen.getByTestId("tab-template"));
  fireEvent.click(screen.getByTestId("publish-template"));
  expect(screen.getByTestId("preview-data-annotations-0-title")).toBeVisible();
  expect(screen.getByTestId("template-errors")).toBeVisible();
  expect(onSave).not.toHaveBeenCalled();
});

test("network failures retain both tabs' edits for retry", async () => {
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    const onSave = jest.fn().mockRejectedValueOnce(new Error("Network unavailable")).mockResolvedValue({ errors: [] });
    render(<TemplateEditor template={templateFixture("kpi")} onSave={onSave} onCancel={jest.fn()} />);
    fireEvent.change(screen.getByTestId("title"), { target: { value: "Keep this title" } });
    fireEvent.click(screen.getByTestId("tab-example-data"));
    fireEvent.click(screen.getByTestId("add-preview-entry"));
    fireEvent.change(screen.getByTestId("preview-data-entries-0-value"), { target: { value: "25" } });
    fireEvent.click(screen.getByTestId("save-template-draft"));
    expect(await screen.findByTestId("template-errors")).toBeVisible();
    expect(showSuccessToast).not.toHaveBeenCalled();
    expect(screen.getByTestId("preview-data-entries-0-value")).toHaveValue(25);
    fireEvent.click(screen.getByTestId("tab-template"));
    expect(screen.getByTestId("title")).toHaveValue("Keep this title");
    fireEvent.click(screen.getByTestId("save-template-draft"));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
    expect(onSave.mock.calls[1]).toEqual(onSave.mock.calls[0]);
  } finally {
    log.mockRestore();
  }
});
