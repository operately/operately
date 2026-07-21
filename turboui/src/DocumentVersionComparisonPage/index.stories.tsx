import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

import * as RichFixtures from "../RichContentDiff/__tests__/fixtures";
import * as M from "../DocumentVersionHistoryPage/mockData";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { defaultFormattedTimePreferences } from "../utils/storybook/formattedTime";

import { DocumentVersionComparisonPage } from "./index";

const handlers = createMockRichEditorHandlers();

const meta: Meta<typeof DocumentVersionComparisonPage> = {
  title: "Pages/DocumentVersionComparisonPage",
  component: DocumentVersionComparisonPage,
  parameters: {
    layout: "fullscreen",
    reactRouter: {
      path: "/documents/1/versions/5",
      routePath: "/documents/:id/versions/:versionNumber",
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
type Story = StoryObj<typeof DocumentVersionComparisonPage>;

function baseProps(
  overrides: Partial<DocumentVersionComparisonPage.Props> = {},
): DocumentVersionComparisonPage.Props {
  return {
    title: ["See what changed", M.titles.current],
    navigation: M.navigation,
    versions: M.multiVersionList,
    before: M.snapshot(4, M.titles.renamed, M.contentV1),
    after: M.snapshot(5, M.titles.current, M.contentV2),
    comparisonStatus: "ready",
    formattedTimePreferences: defaultFormattedTimePreferences,
    mentionedPersonLookup: handlers.mentionedPersonLookup,
    onRetryComparison: () => undefined,
    ...overrides,
  };
}

export const AdjacentTextEdit: Story = { args: baseProps() };

export const TitleOnlyEdit: Story = {
  args: baseProps({
    before: M.snapshot(3, M.titles.original, M.contentTitleOnly),
    after: M.snapshot(4, M.titles.renamed, M.contentTitleOnly),
  }),
};

export const FormattingOnly: Story = {
  args: baseProps({
    before: M.snapshot(4, M.titles.renamed, RichFixtures.marksBefore),
    after: M.snapshot(5, M.titles.renamed, RichFixtures.marksAfter),
  }),
};

export const MentionAndBlob: Story = {
  args: baseProps({
    before: M.snapshot(4, M.titles.renamed, M.contentMentionBlobBefore),
    after: M.snapshot(5, M.titles.renamed, M.contentMentionBlob),
  }),
};

export const LongSplitDiff: Story = {
  args: baseProps({
    before: M.snapshot(4, M.titles.renamed, M.contentLong.before),
    after: M.snapshot(5, M.titles.current, M.contentLong.after),
  }),
};

export const FirstVersion: Story = {
  args: baseProps({
    before: null,
    after: M.snapshot(1, M.titles.original, M.contentV1),
  }),
};

export const LoadingComparison: Story = {
  args: baseProps({ comparisonStatus: "loading", before: null, after: null }),
};

export const ComparisonError: Story = {
  args: baseProps({ comparisonStatus: "error", before: null, after: null }),
};
