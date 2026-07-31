import type { Meta, StoryObj } from "@storybook/react-vite";

import { defaultFormattedTimePreferences } from "../FormattedTime";
import { SearchIndexAdminPage, SearchIndexSourceStatus } from "./index";

const now = "2026-07-30T18:00:00Z";

function source(
  sourceType: string,
  status: "pending" | "running" | "completed" | "completed_with_errors" | "failed",
  overrides: Partial<NonNullable<SearchIndexSourceStatus["latestRun"]>> = {},
): SearchIndexSourceStatus {
  return {
    sourceType,
    latestRun: {
      id: `run-${sourceType}`,
      kind: status === "running" ? "reconciliation" : "backfill",
      status,
      phase: status === "running" ? "index_scan" : "source_scan",
      processedCount: 1842,
      insertedCount: 1100,
      updatedCount: 241,
      unchangedCount: 460,
      supersededCount: 3,
      skippedCount: 28,
      failedCount: status === "completed_with_errors" ? 10 : 0,
      deletedOrphanCount: status === "running" ? 13 : 0,
      lastError: status === "completed_with_errors" ? "invalid_source" : null,
      startedAt: now,
      completedAt: status === "running" || status === "pending" ? null : now,
      insertedAt: now,
      ...overrides,
    },
  };
}

const sources: SearchIndexSourceStatus[] = [
  source("resource_hub_folder", "completed"),
  source("resource_hub_document", "completed"),
  source("resource_hub_file", "completed"),
  source("resource_hub_link", "completed"),
  source("project", "completed"),
  source("goal", "running"),
  source("milestone", "pending"),
  source("task", "completed_with_errors"),
  source("person", "failed", { lastError: "database_connection" }),
  { sourceType: "discussion", latestRun: null },
  source("project_check_in", "completed"),
  source("goal_check_in", "completed"),
  source("project_retrospective", "completed"),
];

const meta = {
  title: "Pages/SearchIndexAdminPage",
  component: SearchIndexAdminPage,
  parameters: { layout: "fullscreen" },
  args: {
    sources,
    formattedTimePreferences: defaultFormattedTimePreferences,
    onStartMaintenance: async (_kind, sourceType) => ({
      startedSourceTypes: sourceType ? [sourceType] : sources.map((source) => source.sourceType),
      alreadyRunningSourceTypes: [],
    }),
  },
} satisfies Meta<typeof SearchIndexAdminPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MixedStatuses: Story = {};

export const InitialInstallation: Story = {
  args: { sources: sources.map(({ sourceType }) => ({ sourceType, latestRun: null })) },
};

export const AllRunning: Story = {
  args: { sources: sources.map(({ sourceType }) => source(sourceType, "running")) },
};

export const ActionFailure: Story = {
  args: {
    onStartMaintenance: async () => {
      throw new Error("unavailable");
    },
  },
};
