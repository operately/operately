import type { Meta, StoryObj } from "@storybook/react";

import { CompanyExportPage } from "./index";

const now = new Date().toISOString();

const meta = {
  title: "Pages/CompanyExportPage",
  component: CompanyExportPage,
  parameters: {
    layout: "fullscreen",
    reactRouter: {
      path: "/admin/export-company",
      routePath: "/admin/export-company",
    },
  },
} satisfies Meta<typeof CompanyExportPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultArgs: CompanyExportPage.Props = {
  backPath: "/admin",
  starting: false,
  downloading: null,
  onStartExport: () => {},
  onDownload: (_runId: string) => {},
  runs: [
    {
      id: "run-1",
      status: "completed",
      currentStep: "publish_artifacts",
      percentage: 100,
      rowsCount: 124,
      tablesCount: 18,
      insertedAt: now,
      completedAt: now,
    },
    {
      id: "run-2",
      status: "running",
      currentStep: "collect_tables",
      percentage: 42,
      rowsCount: 88,
      tablesCount: 11,
      insertedAt: now,
      completedAt: null,
    },
  ],
};

export const Default: Story = {
  args: defaultArgs,
};

export const EmptyState: Story = {
  args: {
    ...defaultArgs,
    runs: [],
  },
};
