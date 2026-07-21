import { createRichContentSchema } from "../schema";
import { diffRichContent } from "../diffRichContent";
import { operatelyTokenEncoder } from "../tokenEncoder";
import type { RichContentChange } from "../types";
import * as F from "./fixtures";

describe("diffRichContent", () => {
  const schema = createRichContentSchema();

  function diff(before: unknown, after: unknown) {
    return diffRichContent(schema, before, after);
  }

  function expectChanges(before: unknown, after: unknown, changes: RichContentChange[]) {
    expect(diff(before, after)).toEqual({ ok: true, changes });
  }

  test("identical documents produce no changes", () => {
    const result = diff(F.identicalDoc, F.identicalDoc);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.changes).toEqual([]);
  });

  test("character insertion", () => {
    expectChanges(F.charInsertBefore, F.charInsertAfter, [
      { kind: "addition", fromA: 12, toA: 12, fromB: 12, toB: 13 },
    ]);
  });

  test("character deletion", () => {
    expectChanges(F.charInsertAfter, F.charInsertBefore, [
      { kind: "deletion", fromA: 12, toA: 13, fromB: 12, toB: 12 },
    ]);
  });

  test("word replacement", () => {
    expectChanges(F.wordReplaceBefore, F.wordReplaceAfter, [
      { kind: "replacement", fromA: 5, toA: 10, fromB: 5, toB: 9 },
    ]);
  });

  test("paragraph insertion", () => {
    expectChanges(F.paragraphInsertBefore, F.paragraphInsertAfter, [
      { kind: "addition", fromA: 7, toA: 7, fromB: 7, toB: 15 },
    ]);
  });

  test("paragraph deletion", () => {
    expectChanges(F.paragraphInsertAfter, F.paragraphInsertBefore, [
      { kind: "deletion", fromA: 7, toA: 15, fromB: 7, toB: 7 },
    ]);
  });

  test("multiple distant changes", () => {
    expectChanges(F.distantChangesBefore, F.distantChangesAfter, [
      { kind: "addition", fromA: 4, toA: 4, fromB: 4, toB: 5 },
      { kind: "addition", fromA: 14, toA: 14, fromB: 15, toB: 16 },
    ]);
  });

  test("paragraph to heading", () => {
    expectChanges(F.paragraphToHeadingBefore, F.paragraphToHeadingAfter, [
      { kind: "replacement", fromA: 0, toA: 1, fromB: 0, toB: 1 },
      { kind: "replacement", fromA: 6, toA: 7, fromB: 6, toB: 7 },
    ]);
  });

  test("heading level change", () => {
    expectChanges(F.headingLevelBefore, F.headingLevelAfter, [
      { kind: "replacement", fromA: 0, toA: 1, fromB: 0, toB: 1 },
    ]);
  });

  test("list type change", () => {
    expectChanges(F.listTypeBefore, F.listTypeAfter, [
      { kind: "replacement", fromA: 0, toA: 1, fromB: 0, toB: 1 },
      { kind: "replacement", fromA: 8, toA: 9, fromB: 8, toB: 9 },
    ]);
  });

  test("list item nesting", () => {
    expectChanges(F.listNestBefore, F.listNestAfter, [{ kind: "addition", fromA: 10, toA: 10, fromB: 10, toB: 21 }]);
  });

  test("list item insertion", () => {
    expectChanges(F.listItemInsertBefore, F.listItemInsertAfter, [
      { kind: "addition", fromA: 8, toA: 8, fromB: 8, toB: 15 },
    ]);
  });

  test.each(F.markChanges)("$name mark change", ({ after }) => {
    expectChanges(F.marksBefore, after, [{ kind: "replacement", fromA: 1, toA: 6, fromB: 1, toB: 6 }]);
  });

  test("multiple simultaneous mark changes", () => {
    expectChanges(F.marksBefore, F.marksAfter, [{ kind: "replacement", fromA: 1, toA: 6, fromB: 1, toB: 6 }]);
  });

  test("link destination change with unchanged text", () => {
    expectChanges(F.linkBefore, F.linkAfter, [{ kind: "replacement", fromA: 1, toA: 5, fromB: 1, toB: 5 }]);
  });

  test("mention id and label change", () => {
    expectChanges(F.mentionBefore, F.mentionAfter, [{ kind: "replacement", fromA: 1, toA: 2, fromB: 1, toB: 2 }]);
  });

  test("blob replacement and caption change", () => {
    expectChanges(F.blobBefore, F.blobAfter, [{ kind: "replacement", fromA: 1, toA: 2, fromB: 1, toB: 2 }]);
  });

  test("ignores blob progress and temporary URL changes", () => {
    const result = diff(F.blobIgnoredBefore, F.blobIgnoredAfter);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.changes).toEqual([]);
  });

  test("emoji / surrogate-pair text", () => {
    expectChanges(F.emojiBefore, F.emojiAfter, [{ kind: "addition", fromA: 9, toA: 9, fromB: 9, toB: 15 }]);
  });

  test("reordered blocks appear as deletion plus insertion", () => {
    expectChanges(F.reorderBefore, F.reorderAfter, [
      { kind: "deletion", fromA: 0, toA: 22, fromB: 0, toB: 0 },
      { kind: "addition", fromA: 47, toA: 47, fromB: 25, toB: 47 },
    ]);
  });

  test("stable equality despite object-key ordering", () => {
    const result = diff(F.keyOrderBefore, F.keyOrderAfter);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.changes).toEqual([]);
  });

  test("full-document replacement returns a change set", () => {
    const before = F.buildLargeDocument(80);
    const after = F.doc(F.paragraph(F.text("Completely different")));

    expectChanges(before, after, [{ kind: "replacement", fromA: 0, toA: 7805, fromB: 0, toB: 21 }]);
  });

  test("parse error for invalid content", () => {
    expect(diff({ type: "paragraph" }, F.identicalDoc)).toEqual({ ok: false, error: "parse_error" });
    expect(diff(F.identicalDoc, null)).toEqual({ ok: false, error: "parse_error" });
  });
});

describe("operatelyTokenEncoder", () => {
  const schema = createRichContentSchema();

  test("blob tokens ignore progress/status/src when id is present", () => {
    const a = schema.nodeFromJSON(F.blobIgnoredBefore);
    const b = schema.nodeFromJSON(F.blobIgnoredAfter);
    const blobA = a.firstChild!.firstChild!;
    const blobB = b.firstChild!.firstChild!;

    expect(operatelyTokenEncoder.encodeNodeStart(blobA)).toBe(operatelyTokenEncoder.encodeNodeStart(blobB));
  });

  test("mark order does not affect character tokens", () => {
    const marksAsc = [schema.marks.bold.create(), schema.marks.italic.create()];
    const marksDesc = [schema.marks.italic.create(), schema.marks.bold.create()];

    const char = "a".codePointAt(0)!;
    expect(operatelyTokenEncoder.encodeCharacter(char, marksAsc)).toBe(
      operatelyTokenEncoder.encodeCharacter(char, marksDesc),
    );
  });
});
