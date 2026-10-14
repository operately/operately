import React from "react";
import { configure, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PreviewDataEditor } from "./PreviewDataEditor";
import { templateFixture } from "../mockData";
import { setupTestCatalog } from "../../../test/i18n";

setupTestCatalog();
configure({ testIdAttribute: "data-test-id" });

test("failed saves retain example edits and show the returned field error", async () => {
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    const onSave = jest
      .fn()
      .mockResolvedValue({ errors: [{ path: "preview_data.entries.0.value", message: "Invalid measurement" }] });
    const template = {
      ...templateFixture("kpi"),
      previewData: JSON.stringify({ entries: [{ date: "2026-09-30", value: 10 }] }),
    };
    render(<PreviewDataEditor template={template} onSave={onSave} />);
    fireEvent.change(screen.getByTestId("preview-data-entries-0-value"), { target: { value: "25" } });
    fireEvent.click(screen.getByTestId("save-preview-data"));
    expect(await screen.findByTestId("preview-data-errors")).toBeVisible();
    expect(screen.getByTestId("preview-data-entries-0-value")).toHaveValue(25);
    expect(screen.getByTestId("preview-data-errors")).toHaveTextContent("Invalid measurement");
  } finally {
    log.mockRestore();
  }
});

test("edits and removes KPI example data separately from the definition", async () => {
  const onSave = jest.fn().mockResolvedValue({ errors: [] });
  const template = {
    ...templateFixture("kpi"),
    previewData: JSON.stringify({
      entries: [{ date: "2026-09-30", value: 12 }],
      annotations: [{ date: "2026-09-01", title: "Campaign" }],
    }),
  };
  render(<PreviewDataEditor template={template} onSave={onSave} />);
  fireEvent.change(screen.getByTestId("preview-data-entries-0-value"), { target: { value: "15.5" } });
  fireEvent.click(screen.getByTestId("remove-preview-annotation-0"));
  fireEvent.click(screen.getByTestId("save-preview-data"));
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  const saved = onSave.mock.calls[0][0];
  expect(JSON.parse(saved)).toEqual({ entries: [{ date: "2026-09-30", value: 15.5 }], annotations: [] });
});

test("adds a measurement through the calendar and submits it as preview data", async () => {
  const onSave = jest.fn().mockResolvedValue({ errors: [] });
  render(<PreviewDataEditor template={templateFixture("kpi")} onSave={onSave} />);
  fireEvent.click(screen.getByTestId("add-preview-entry"));
  fireEvent.change(screen.getByTestId("preview-data-entries-0-value"), { target: { value: "416" } });
  fireEvent.click(screen.getByTestId("preview-data-entries-0-date"));
  const day = document.querySelector<HTMLElement>('[data-date]:not([aria-disabled="true"])');
  if (!day) throw new Error("Expected a selectable calendar day");
  const date = day.dataset.date;
  fireEvent.click(day);
  fireEvent.click(screen.getByTestId("date-field-confirm"));
  fireEvent.click(screen.getByTestId("save-preview-data"));
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  expect(JSON.parse(onSave.mock.calls[0][0]).entries).toEqual([{ date, value: 416 }]);
});
