import * as React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";

import { defaultFormattedTimePreferences } from "../FormattedTime";
import { SearchIndexAdminPage, SearchIndexSourceStatus } from "./index";

const sources: SearchIndexSourceStatus[] = [
  {
    sourceType: "project",
    latestRun: {
      id: "run-1",
      kind: "backfill",
      status: "completed_with_errors",
      phase: "source_scan",
      processedCount: 120,
      insertedCount: 80,
      updatedCount: 12,
      unchangedCount: 20,
      supersededCount: 1,
      skippedCount: 5,
      failedCount: 2,
      deletedOrphanCount: 0,
      lastError: "invalid_source",
      startedAt: "2026-07-30T10:00:00Z",
      completedAt: "2026-07-30T10:01:00Z",
      insertedAt: "2026-07-30T10:00:00Z",
    },
  },
  {
    sourceType: "goal",
    latestRun: {
      id: "run-2",
      kind: "reconciliation",
      status: "running",
      phase: "index_scan",
      processedCount: 25,
      insertedCount: 2,
      updatedCount: 4,
      unchangedCount: 17,
      supersededCount: 0,
      skippedCount: 1,
      failedCount: 0,
      deletedOrphanCount: 1,
      startedAt: "2026-07-30T11:00:00Z",
      insertedAt: "2026-07-30T11:00:00Z",
    },
  },
  { sourceType: "task", latestRun: null },
];

function renderPage(
  onStartMaintenance = jest.fn().mockResolvedValue({ startedSourceTypes: [], alreadyRunningSourceTypes: [] }),
) {
  return render(
    <SearchIndexAdminPage
      sources={sources}
      formattedTimePreferences={defaultFormattedTimePreferences}
      onStartMaintenance={onStartMaintenance}
    />,
  );
}

describe("SearchIndexAdminPage", () => {
  test("explains maintenance and renders source status, progress, and errors", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "Search index" })).toBeInTheDocument();
    expect(
      screen.getByText("Backfills add missing entries. Reconciliation performs a complete repair."),
    ).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Completed with errors")).toBeInTheDocument();
    expect(screen.getByText("Backfill · Source scan")).toBeInTheDocument();
    expect(screen.getAllByText("Started:")).toHaveLength(2);
    expect(screen.getByText("Completed:")).toBeInTheDocument();
    expect(screen.getAllByText("Processed:")[0].parentElement).toHaveTextContent("120");
    expect(screen.getByText("invalid_source")).toBeInTheDocument();
    expect(screen.getByText("Not started")).toBeInTheDocument();
  });

  test("confirms and starts maintenance for one source", async () => {
    const onStart = jest.fn().mockResolvedValue({ startedSourceTypes: ["project"], alreadyRunningSourceTypes: [] });
    renderPage(onStart);

    fireEvent.click(screen.getAllByRole("button", { name: "Run reconciliation" })[0]);
    const title = screen.getByText("Reconcile Projects?");
    expect(title).toBeInTheDocument();

    const dialog = title.parentElement?.parentElement;
    if (!dialog) throw new Error("Expected reconciliation confirmation dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Run reconciliation" }));

    await waitFor(() => expect(onStart).toHaveBeenCalledWith("reconciliation", "project"));
  });

  test("confirms all-source maintenance", async () => {
    const onStart = jest.fn().mockResolvedValue({ startedSourceTypes: ["project"], alreadyRunningSourceTypes: [] });
    renderPage(onStart);

    fireEvent.click(screen.getByRole("button", { name: "Backfill all sources" }));
    const title = screen.getByText("Backfill all sources?");
    expect(title).toBeInTheDocument();
    const dialog = title.parentElement?.parentElement;
    if (!dialog) throw new Error("Expected backfill confirmation dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Run backfill" }));

    await waitFor(() => expect(onStart).toHaveBeenCalledWith("backfill", undefined));
  });

  test("disables source actions while a run is active", () => {
    renderPage();

    const goalRow = screen.getByText("Goals").closest(".grid");
    const buttons = goalRow?.querySelectorAll("button");
    expect(buttons).toHaveLength(2);
    expect(buttons?.[0]).toBeDisabled();
    expect(buttons?.[1]).toBeDisabled();
  });

  test("shows a recoverable error when an action fails", async () => {
    renderPage(jest.fn().mockRejectedValue(new Error("unavailable")));

    fireEvent.click(screen.getByRole("button", { name: "Reconcile all sources" }));
    const title = screen.getByText("Reconcile all sources?");
    const dialog = title.parentElement?.parentElement;
    if (!dialog) throw new Error("Expected reconciliation confirmation dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Run reconciliation" }));

    expect(await screen.findByText("Search index maintenance could not be started. Try again.")).toBeInTheDocument();
  });
});
