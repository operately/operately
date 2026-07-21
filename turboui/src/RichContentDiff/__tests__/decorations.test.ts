import type { Node } from "@tiptap/pm/model";

import { buildDiffDecorations, type DiffDecorationSide } from "../decorations";
import { diffRichContent } from "../diffRichContent";
import { createRichContentSchema } from "../schema";
import type { RichContentChange } from "../types";
import * as F from "./fixtures";

const schema = createRichContentSchema();

function decorationsFor(before: unknown, after: unknown, side: DiffDecorationSide) {
  const result = diffRichContent(schema, before, after);
  if (!result.ok) throw new Error("Expected valid fixture content");

  const content = side === "before" ? before : after;
  const doc = schema.nodeFromJSON(content);

  return buildDiffDecorations(doc, result.changes, side).find();
}

function decorationRanges(doc: Node, changes: RichContentChange[], side: DiffDecorationSide) {
  return buildDiffDecorations(doc, changes, side)
    .find()
    .map(({ from, to }) => ({ from, to }));
}

describe("buildDiffDecorations", () => {
  test("decorates inserted text inline without decorating the unchanged side", () => {
    expect(decorationsFor(F.charInsertBefore, F.charInsertAfter, "before")).toEqual([]);
    expect(decorationsFor(F.charInsertBefore, F.charInsertAfter, "after")).toMatchObject([{ from: 12, to: 13 }]);
  });

  test("decorates both sides of a text replacement inline", () => {
    expect(decorationsFor(F.wordReplaceBefore, F.wordReplaceAfter, "before")).toMatchObject([{ from: 5, to: 10 }]);
    expect(decorationsFor(F.wordReplaceBefore, F.wordReplaceAfter, "after")).toMatchObject([{ from: 5, to: 9 }]);
  });

  test("decorates a complete inserted or deleted paragraph as one block", () => {
    expect(decorationsFor(F.paragraphInsertBefore, F.paragraphInsertAfter, "after")).toMatchObject([
      { from: 7, to: 15 },
    ]);
    expect(decorationsFor(F.paragraphInsertAfter, F.paragraphInsertBefore, "before")).toMatchObject([
      { from: 7, to: 15 },
    ]);
  });

  test("decorates every complete block in a merged insertion", () => {
    const before = F.doc(F.paragraph(F.text("First")));
    const after = F.doc(F.paragraph(F.text("First")), F.paragraph(F.text("Second")), F.paragraph(F.text("Third")));

    expect(decorationsFor(before, after, "after")).toMatchObject([
      { from: 7, to: 15 },
      { from: 15, to: 22 },
    ]);
  });

  test("deduplicates opening and closing structural changes for the same block", () => {
    expect(decorationsFor(F.paragraphToHeadingBefore, F.paragraphToHeadingAfter, "before")).toMatchObject([
      { from: 0, to: 7 },
    ]);
    expect(decorationsFor(F.paragraphToHeadingBefore, F.paragraphToHeadingAfter, "after")).toMatchObject([
      { from: 0, to: 7 },
    ]);
  });

  test("decorates a heading attribute change as a block", () => {
    expect(decorationsFor(F.headingLevelBefore, F.headingLevelAfter, "before")).toMatchObject([{ from: 0, to: 7 }]);
    expect(decorationsFor(F.headingLevelBefore, F.headingLevelAfter, "after")).toMatchObject([{ from: 0, to: 7 }]);
  });

  test("decorates a list type change as one block on each side", () => {
    expect(decorationsFor(F.listTypeBefore, F.listTypeAfter, "before")).toMatchObject([{ from: 0, to: 9 }]);
    expect(decorationsFor(F.listTypeBefore, F.listTypeAfter, "after")).toMatchObject([{ from: 0, to: 9 }]);
  });

  test("decorates inserted list structures as blocks", () => {
    expect(decorationsFor(F.listItemInsertBefore, F.listItemInsertAfter, "after")).toMatchObject([{ from: 8, to: 15 }]);
    expect(decorationsFor(F.listNestBefore, F.listNestAfter, "after")).toMatchObject([{ from: 10, to: 21 }]);
  });

  test.each([
    ["mention", F.mentionBefore, F.mentionAfter],
    ["blob", F.blobBefore, F.blobAfter],
  ])("decorates a changed %s leaf node", (_name, before, after) => {
    expect(decorationsFor(before, after, "before")).toMatchObject([{ from: 1, to: 2 }]);
    expect(decorationsFor(before, after, "after")).toMatchObject([{ from: 1, to: 2 }]);
  });

  test("clamps invalid ranges without resolving outside the document", () => {
    const doc = schema.nodeFromJSON(F.identicalDoc);
    const changes: RichContentChange[] = [{ kind: "replacement", fromA: 100, toA: 200, fromB: 100, toB: 200 }];

    expect(decorationRanges(doc, changes, "before")).toEqual([]);
  });
});
