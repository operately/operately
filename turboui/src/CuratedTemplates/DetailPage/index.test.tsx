import React from "react";
import { render, fireEvent, screen, waitFor, configure } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, useLocation } from "react-router";
import { CuratedTemplateDetailPage } from "./index";
import { templateFixture } from "../mockData";
import { defaultFormattedTimePreferences } from "../../FormattedTime";

configure({ testIdAttribute: "data-test-id" });

function Location() {
  return <span data-test-id="location">{useLocation().pathname}</span>;
}

function setup(state: "draft" | "published" = "draft") {
  const onDelete = jest.fn().mockResolvedValue(undefined);
  const onPublish = jest.fn().mockResolvedValue({ errors: [{ path: "definition.unit", message: "Required" }] });
  render(
    <MemoryRouter>
      <CuratedTemplateDetailPage
        editing
        formattedTimePreferences={defaultFormattedTimePreferences}
        template={{
          ...templateFixture("kpi"),
          definition: "{}",
          state,
        }}
        catalogPath="/"
        previewPath="/preview"
        onSave={onPublish}
        onCancel={jest.fn()}
        onDelete={onDelete}
      />
    </MemoryRouter>,
  );
  return { onPublish, onDelete };
}

test("publication errors keep an incomplete template in draft", async () => {
  const { onPublish } = setup();
  fireEvent.click(screen.getByTestId("publish-template"));
  await waitFor(() => expect(onPublish).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(screen.getByTestId("template-errors")).toBeInTheDocument());
  expect(screen.getByTestId("definition-unit")).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByTestId("template-state")).toHaveAttribute("data-state", "draft");
});

test("unsaved edits can be published", () => {
  setup();
  fireEvent.change(screen.getByTestId("title"), { target: { value: "Unsaved KPI" } });
  expect(screen.getByTestId("publish-template")).toBeEnabled();
});

test.each(["template", "example-data"])("saving from %s includes edits from both tabs", async (tab) => {
  const template = {
    ...templateFixture("kpi"),
    previewData: JSON.stringify({ entries: [{ period_offset: -1, value: 10 }] }),
  };
  const onSave = jest.fn().mockResolvedValue({ errors: [] });
  render(
    <MemoryRouter>
      <CuratedTemplateDetailPage
        editing
        formattedTimePreferences={defaultFormattedTimePreferences}
        template={template}
        catalogPath="/"
        onSave={onSave}
        onCancel={jest.fn()}
        onDelete={jest.fn()}
      />
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByTestId("title"), { target: { value: "Unsaved title" } });
  fireEvent.click(screen.getByTestId("tab-example-data"));
  fireEvent.change(screen.getByTestId("preview-data-entries-0-value"), { target: { value: "25.5" } });
  fireEvent.click(screen.getByTestId(`tab-${tab}`));
  expect(screen.getByTestId("save-template-draft")).toBeVisible();
  fireEvent.click(screen.getByTestId("save-template-draft"));
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  expect(onSave.mock.calls[0][0].title).toBe("Unsaved title");
  expect(JSON.parse(onSave.mock.calls[0][0].definition).name).toBe("Unsaved title");
  expect(JSON.parse(onSave.mock.calls[0][0].previewData)).toEqual({
    entries: [{ period_offset: -1, value: 25.5 }],
    annotations: [],
  });
});

test.each(["draft", "published"] as const)("deletes a %s template after confirmation", async (state) => {
  const { onDelete } = setup(state);
  fireEvent.keyDown(screen.getByTestId("template-actions"), { key: "ArrowDown" });
  fireEvent.click(await screen.findByTestId("delete-template"));
  expect(onDelete).not.toHaveBeenCalled();
  fireEvent.click(screen.getByTestId("template-action-confirmation-confirm"));
  await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
});

test("preview opens saved content from the menu without saving editor changes", async () => {
  const { onPublish } = setup();
  fireEvent.change(screen.getByTestId("title"), { target: { value: "Unsaved title" } });
  expect(screen.queryByTestId("preview-template")).not.toBeInTheDocument();
  fireEvent.keyDown(screen.getByTestId("template-actions"), { key: "ArrowDown" });
  expect(await screen.findByTestId("preview-template")).toHaveAttribute("href", "/preview");
  expect(screen.getByTestId("preview-template")).toHaveAttribute("target", "_blank");
  expect(onPublish).not.toHaveBeenCalled();
});

test.each(["kpi", "goal", "project"] as const)("opens a saved %s template in read mode", async (type) => {
  const template = templateFixture(type);
  const { container } = render(
    <MemoryRouter>
      <Location />
      <CuratedTemplateDetailPage
        template={template}
        catalogPath="/"
        editPath="/template/edit"
        previewPath="/template/preview"
        formattedTimePreferences={defaultFormattedTimePreferences}
        onSave={jest.fn()}
        onCancel={jest.fn()}
        onDelete={jest.fn()}
      />
    </MemoryRouter>,
  );
  expect(screen.getByTestId("template-details")).toBeInTheDocument();
  expect(screen.queryByTestId("curated-template-form")).not.toBeInTheDocument();
  expect(container.querySelector("input, textarea, [contenteditable='true']")).toBeNull();
  expect(screen.getByText(template.slug)).toBeInTheDocument();
  const detail = { kpi: "USD", goal: "Reduce churn", project: "Write the welcome guide" }[type];
  expect(screen.getByText(detail)).toBeInTheDocument();
  fireEvent.keyDown(screen.getByTestId("template-actions"), { key: "ArrowDown" });
  expect(await screen.findByTestId("edit-template")).toBeInTheDocument();
  expect(screen.getByTestId("preview-template")).toHaveAttribute("href", "/template/preview");
  expect(screen.getByTestId("delete-template")).toBeInTheDocument();
  fireEvent.click(screen.getByTestId("edit-template"));
  expect(screen.getByTestId("location")).toHaveTextContent("/template/edit");
});
