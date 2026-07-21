import { createRichContentSchema } from "../schema";
import { diffRichContent } from "../diffRichContent";
import { operatelyTokenEncoder } from "../tokenEncoder";
import * as F from "./fixtures";

describe("diffRichContent", () => {
  const schema = createRichContentSchema();

  function diff(before: unknown, after: unknown) {
    return diffRichContent(schema, before, after);
  }

  test("identical documents produce no changes", () => {
    const result = diff(F.identicalDoc, F.identicalDoc);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.changes).toEqual([]);
  });

  test("character insertion", () => {
    const result = diff(F.charInsertBefore, F.charInsertAfter);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.changes.length).toBeGreaterThan(0);
    expect(result.changes.some((c) => c.kind === "addition" || c.kind === "replacement")).toBe(true);
  });

  test("character deletion", () => {
    const result = diff(F.charInsertAfter, F.charInsertBefore);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.changes.some((c) => c.kind === "deletion" || c.kind === "replacement")).toBe(true);
  });

  test("word replacement", () => {
    const result = diff(F.wordReplaceBefore, F.wordReplaceAfter);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.changes.some((c) => c.kind === "replacement")).toBe(true);
  });

  test("paragraph insertion", () => {
    const result = diff(F.paragraphInsertBefore, F.paragraphInsertAfter);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.changes.some((c) => c.kind === "addition" || c.kind === "replacement")).toBe(true);
  });

  test("paragraph deletion", () => {
    const result = diff(F.paragraphInsertAfter, F.paragraphInsertBefore);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.changes.some((c) => c.kind === "deletion" || c.kind === "replacement")).toBe(true);
  });

  test("multiple distant changes", () => {
    const result = diff(F.distantChangesBefore, F.distantChangesAfter);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.changes.length).toBeGreaterThanOrEqual(2);
  });

  test("paragraph to heading", () => {
    const result = diff(F.paragraphToHeadingBefore, F.paragraphToHeadingAfter);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.changes.length).toBeGreaterThan(0);
  });

  test("heading level change", () => {
    const result = diff(F.headingLevelBefore, F.headingLevelAfter);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.changes.length).toBeGreaterThan(0);
  });

  test("list type change", () => {
    const result = diff(F.listTypeBefore, F.listTypeAfter);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.changes.length).toBeGreaterThan(0);
  });

  test("list item nesting", () => {
    const result = diff(F.listNestBefore, F.listNestAfter);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.changes.length).toBeGreaterThan(0);
  });

  test("mark changes", () => {
    const result = diff(F.marksBefore, F.marksAfter);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.changes.some((c) => c.kind === "replacement")).toBe(true);
  });

  test("link destination change with unchanged text", () => {
    const result = diff(F.linkBefore, F.linkAfter);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.changes.length).toBeGreaterThan(0);
  });

  test("mention id and label change", () => {
    const result = diff(F.mentionBefore, F.mentionAfter);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.changes.length).toBeGreaterThan(0);
  });

  test("blob replacement and caption change", () => {
    const result = diff(F.blobBefore, F.blobAfter);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.changes.length).toBeGreaterThan(0);
  });

  test("ignores blob progress and temporary URL changes", () => {
    const result = diff(F.blobIgnoredBefore, F.blobIgnoredAfter);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.changes).toEqual([]);
  });

  test("emoji / surrogate-pair text", () => {
    const result = diff(F.emojiBefore, F.emojiAfter);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.changes.length).toBeGreaterThan(0);
  });

  test("reordered blocks appear as deletion plus insertion", () => {
    const result = diff(F.reorderBefore, F.reorderAfter);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.changes.length).toBeGreaterThan(0);
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
    const result = diff(before, after);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.changes.length).toBeGreaterThan(0);
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
    const marksAsc = [
      schema.marks.bold.create(),
      schema.marks.italic.create(),
    ];
    const marksDesc = [
      schema.marks.italic.create(),
      schema.marks.bold.create(),
    ];

    const char = "a".codePointAt(0)!;
    expect(operatelyTokenEncoder.encodeCharacter(char, marksAsc)).toBe(
      operatelyTokenEncoder.encodeCharacter(char, marksDesc),
    );
  });
});
