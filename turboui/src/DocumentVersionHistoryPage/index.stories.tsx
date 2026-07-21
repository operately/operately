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
    currentTitle: M.titles.current,
    currentContent: M.contentV2,
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

export const OneVersion: Story = {
  args: baseProps({
    title: ["History of changes", M.titles.oneVersion],
    navigation: M.navigationFor(M.titles.oneVersion),
    currentTitle: M.titles.oneVersion,
    currentContent: M.contentV1,
    versions: M.oneVersionList,
  }),
};

export const MigrationBaseline: Story = {
  args: baseProps({
    title: ["History of changes", M.titles.migration],
    navigation: M.navigationFor(M.titles.migration),
    currentTitle: M.titles.migration,
    currentContent: M.contentV1,
    versions: M.migrationBaselineList,
  }),
};

export const MobileStacked: Story = {
  args: baseProps(),
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
};
