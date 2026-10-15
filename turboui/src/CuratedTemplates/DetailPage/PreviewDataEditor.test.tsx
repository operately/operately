import React from "react";
import { configure, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PreviewDataEditor } from "./PreviewDataEditor";
import { showSuccessToast } from "../../Toasts";
import { templateFixture } from "../mockData";
import { setupTestCatalog } from "../../../test/i18n";

jest.mock("../../Toasts", () => ({ showSuccessToast: jest.fn() }));
beforeEach(() => jest.clearAllMocks());

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
      previewData: JSON.stringify({ entries: [{ period_offset: -1, value: 10 }] }),
    };
    render(<PreviewDataEditor template={template} onSave={onSave} />);
    fireEvent.change(screen.getByTestId("preview-data-entries-0-value"), { target: { value: "25" } });
    fireEvent.click(screen.getByTestId("save-preview-data"));
    expect(await screen.findByTestId("preview-data-errors")).toBeVisible();
    expect(screen.getByTestId("preview-data-entries-0-value")).toHaveValue(25);
    expect(screen.getByTestId("preview-data-errors")).toHaveTextContent("Invalid measurement");
    expect(showSuccessToast).not.toHaveBeenCalled();
  } finally {
    log.mockRestore();
  }
});

test("edits and removes KPI example data separately from the definition", async () => {
  const onSave = jest.fn().mockResolvedValue({ errors: [] });
  const template = {
    ...templateFixture("kpi"),
    previewData: JSON.stringify({
      entries: [{ period_offset: -1, value: 12 }],
      annotations: [{ period_offset: -1, title: "Campaign" }],
    }),
  };
  render(<PreviewDataEditor template={template} onSave={onSave} />);
  fireEvent.change(screen.getByTestId("preview-data-entries-0-value"), { target: { value: "15.5" } });
  fireEvent.click(screen.getByTestId("remove-preview-annotation-0"));
  fireEvent.click(screen.getByTestId("save-preview-data"));
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  expect(showSuccessToast).toHaveBeenCalledWith("Success", "The example data has been saved.");
  const saved = onSave.mock.calls[0][0];
  expect(JSON.parse(saved)).toEqual({ entries: [{ period_offset: -1, value: 15.5 }], annotations: [] });
});

test("adds a measurement with a relative period and submits it as preview data", async () => {
  const onSave = jest.fn().mockResolvedValue({ errors: [] });
  render(<PreviewDataEditor template={templateFixture("kpi")} onSave={onSave} />);
  fireEvent.click(screen.getByTestId("add-preview-entry"));
  fireEvent.change(screen.getByTestId("preview-data-entries-0-value"), { target: { value: "416" } });
  fireEvent.change(screen.getByTestId("preview-data-entries-0-period-offset"), { target: { value: "-3" } });
  fireEvent.click(screen.getByTestId("save-preview-data"));
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  expect(JSON.parse(onSave.mock.calls[0][0]).entries).toEqual([{ period_offset: -3, value: 416 }]);
});
