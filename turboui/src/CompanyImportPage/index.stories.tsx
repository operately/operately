import type { Meta, StoryObj } from "@storybook/react";

import { CompanyImportPage } from "./index";

const now = new Date().toISOString();

const meta = {
  title: "Pages/CompanyImportPage",
  component: CompanyImportPage,
  parameters: {
    layout: "fullscreen",
    reactRouter: {
      path: "/company-import",
      routePath: "/company-import",
    },
  },
} satisfies Meta<typeof CompanyImportPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultArgs: CompanyImportPage.Props = {
  backPath: "/lobby",
  starting: false,
  canUpload: true,
  canStartImport: true,
  uploadsUnavailableMessage: null,
  onStartImport: () => {},
  onSelectPackageFile: () => {},
  onClearPackageFile: () => {},
  packageFile: {
    blobId: "blob-package",
    fileName: "operately.zip",
    progress: 100,
    uploading: false,
  },
  runs: [
    {
      id: "run-1",
      status: "completed",
      currentStep: "finish_import",
      percentage: 100,
      rowsCount: 124,
      tablesCount: 18,
      insertedAt: now,
      completedAt: now,
      companyPath: "/companies/1",
    },
    {
      id: "run-2",
      status: "running",
      currentStep: "insert_rows",
      percentage: 58,
      rowsCount: 67,
      tablesCount: 10,
      insertedAt: now,
      completedAt: null,
      companyPath: null,
    },
  ],
};

export const Default: Story = {
  args: defaultArgs,
};

export const UploadsUnavailable: Story = {
  args: {
    ...defaultArgs,
    canUpload: false,
    canStartImport: false,
    uploadsUnavailableMessage: "Uploads are unavailable for this account right now.",
  },
};

export const EmptyState: Story = {
  args: {
    ...defaultArgs,
    runs: [],
    packageFile: { blobId: null, fileName: null, progress: 0, uploading: false },
    canStartImport: false,
  },
};
