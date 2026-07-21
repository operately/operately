import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

import { Page } from "../Page";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { RichContentDiff } from "./index";
import * as F from "./__tests__/fixtures";

const handlers = createMockRichEditorHandlers();

const meta: Meta<typeof RichContentDiff> = {
  title: "Components/RichContentDiff",
  component: RichContentDiff,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="sm:mt-12">
        <Page size="large" title="Rich Content Diff">
          <div className="p-8">
            <Story />
          </div>
        </Page>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RichContentDiff>;

function story(before: unknown, after: unknown): Story {
  return {
    args: {
      before,
      after,
      mentionedPersonLookup: handlers.mentionedPersonLookup,
    },
  };
}

export const Identical: Story = story(F.identicalDoc, F.identicalDoc);
export const CharacterEdit: Story = story(F.charInsertBefore, F.charInsertAfter);
export const WordReplacement: Story = story(F.wordReplaceBefore, F.wordReplaceAfter);
export const ParagraphInsert: Story = story(F.paragraphInsertBefore, F.paragraphInsertAfter);
export const DistantChanges: Story = story(F.distantChangesBefore, F.distantChangesAfter);
export const ParagraphToHeading: Story = story(F.paragraphToHeadingBefore, F.paragraphToHeadingAfter);
export const HeadingLevel: Story = story(F.headingLevelBefore, F.headingLevelAfter);
export const ListType: Story = story(F.listTypeBefore, F.listTypeAfter);
export const ListNesting: Story = story(F.listNestBefore, F.listNestAfter);
export const Marks: Story = story(F.marksBefore, F.marksAfter);
export const LinkDestination: Story = story(F.linkBefore, F.linkAfter);
export const MentionChange: Story = story(F.mentionBefore, F.mentionAfter);
export const BlobReplace: Story = story(F.blobBefore, F.blobAfter);
export const BlobIgnoredChurn: Story = story(F.blobIgnoredBefore, F.blobIgnoredAfter);
export const Emoji: Story = story(F.emojiBefore, F.emojiAfter);
export const ReorderedBlocks: Story = story(F.reorderBefore, F.reorderAfter);

export const ParseError: Story = story({ type: "paragraph", content: [] }, F.identicalDoc);

export const LargeDocument: Story = (() => {
  const before = F.buildLargeDocument(120);
  const after = F.buildLargeDocument(120);
  after.content![20] = F.paragraph(F.text("Edited paragraph inside a large document"));
  return {
    ...story(before, after),
    parameters: {
      docs: {
        description: {
          story:
            "Large fixture for visual/perf checks. Unit tests time a ~400-paragraph document; worker offload is deferred unless main-thread cost is too high.",
        },
      },
    },
  };
})();
