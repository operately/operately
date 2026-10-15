import React from "react";
import { render, fireEvent, screen, waitFor, configure } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";
import { CuratedTemplateDetailPage } from "./index";
import { templateFixture } from "../mockData";

configure({ testIdAttribute: "data-test-id" });

function setup(state: "draft" | "published" = "draft") {
  const onDelete = jest.fn().mockResolvedValue(undefined);
  const onPublish = jest.fn().mockResolvedValue({ errors: [{ path: "definition.unit", message: "Required" }] });
  render(
    <MemoryRouter>
      <CuratedTemplateDetailPage
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

test("example data has a separate save action and both tabs preserve unsaved edits", async () => {
  const template = {
    ...templateFixture("kpi"),
    previewData: JSON.stringify({ entries: [{ period_offset: -1, value: 10 }] }),
  };
  const onSave = jest.fn().mockResolvedValue({ errors: [] });
  const onSavePreviewData = jest.fn().mockResolvedValue({ errors: [] });
  render(
    <MemoryRouter>
      <CuratedTemplateDetailPage
        template={template}
        catalogPath="/"
        onSave={onSave}
        onSavePreviewData={onSavePreviewData}
        onCancel={jest.fn()}
        onDelete={jest.fn()}
      />
    </MemoryRouter>,
  );
  expect(screen.getByTestId("curated-template-form")).toBeVisible();
  fireEvent.change(screen.getByTestId("title"), { target: { value: "Unsaved title" } });
  fireEvent.click(screen.getByTestId("tab-example-data"));
  expect(screen.getByTestId("curated-template-form")).not.toBeVisible();
  expect(screen.getByTestId("template-preview-data-form")).toBeVisible();
  fireEvent.change(screen.getByTestId("preview-data-entries-0-value"), { target: { value: "25" } });
  fireEvent.click(screen.getByTestId("tab-template"));
  expect(screen.getByTestId("title")).toHaveValue("Unsaved title");
  fireEvent.click(screen.getByTestId("tab-example-data"));
  expect(screen.getByTestId("preview-data-entries-0-value")).toHaveValue(25);
  fireEvent.click(screen.getByTestId("save-preview-data"));
  await waitFor(() => expect(onSavePreviewData).toHaveBeenCalledTimes(1));
  expect(JSON.parse(onSavePreviewData.mock.calls[0][0])).toEqual({
    entries: [{ period_offset: -1, value: 25 }],
    annotations: [],
  });
  expect(onSave).not.toHaveBeenCalled();
  fireEvent.click(screen.getByTestId("add-preview-entry"));
  fireEvent.click(screen.getByTestId("tab-template"));
  fireEvent.click(screen.getByTestId("save-template-draft"));
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  expect(onSave.mock.calls[0][0]).not.toHaveProperty("previewData");
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
