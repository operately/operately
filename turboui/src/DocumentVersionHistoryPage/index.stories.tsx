import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { defaultFormattedTimePreferences } from "../utils/storybook/formattedTime";

import { DocumentVersionHistoryPage } from "./index";
import * as M from "./mockData";
import type { DocumentVersionHistoryPageProps } from "./types";

const handlers = createMockRichEditorHandlers();

const meta: Meta<typeof DocumentVersionHistoryPage> = {
  title: "Pages/DocumentVersionHistoryPage",
  component: DocumentVersionHistoryPage,
  parameters: {
    layout: "fullscreen",
    reactRouter: {
      path: "/documents/1/versions",
      routePath: "/documents/:id/versions",
    },
  },
  decorators: [
    (Story) => (
      <div className="sm:mt-8">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DocumentVersionHistoryPage>;

function baseProps(overrides: Partial<DocumentVersionHistoryPageProps> = {}): DocumentVersionHistoryPageProps {
  return {
    title: ["History of changes", M.titles.current],
    navigation: M.navigation,
    versions: M.multiVersionList,
    formattedTimePreferences: defaultFormattedTimePreferences,
    mentionedPersonLookup: handlers.mentionedPersonLookup,
    getComparisonPath: (versionNumber) => `/documents/1/versions/${versionNumber}`,
    ...overrides,
  };
}

export const Default: Story = {
  args: baseProps(),
};

export const WithRestore: Story = {
  args: baseProps({
    canRestore: true,
    currentVersionNumber: 5,
    onRestore: async () => "ok",
    onReload: () => undefined,
  }),
};

function RestoreConflictHarness() {
  const [key, setKey] = React.useState(0);

  return (
    <DocumentVersionHistoryPage
      key={key}
      {...baseProps({
        canRestore: true,
        currentVersionNumber: 5,
        onRestore: async () => "conflict",
        onReload: () => setKey((value) => value + 1),
      })}
    />
  );
}

export const RestoreConflict: Story = {
  render: () => <RestoreConflictHarness />,
  play: async ({ canvasElement }) => {
    const select = canvasElement.querySelector('[data-test-id="select-version-4"]') as HTMLButtonElement | null;
    select?.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const restore = canvasElement.querySelector('[data-test-id="restore-this-version"]') as HTMLButtonElement | null;
    restore?.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const confirm = Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent === "Restore",
    );
    confirm?.click();
  },
};

export const OneVersion: Story = {
  args: baseProps({
    title: ["History of changes", M.titles.oneVersion],
    navigation: M.navigationFor(M.titles.oneVersion),
    versions: M.oneVersionList,
  }),
};

export const MobileStacked: Story = {
  args: baseProps(),
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
};
