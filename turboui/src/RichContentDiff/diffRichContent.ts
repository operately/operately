import type { JSONContent } from "@tiptap/core";
import type { Schema } from "@tiptap/pm/model";
import { ChangeSet, simplifyChanges } from "@tiptap/pm/changeset";
import { StepMap } from "@tiptap/pm/transform";

import { operatelyTokenEncoder } from "./tokenEncoder";
import type { DiffRichContentResult, RichContentChange, RichContentChangeKind } from "./types";

function combineChangeMetadata<T>(a: T, b: T): T | null {
  return a === b ? a : null;
}

function classifyChange(fromA: number, toA: number, fromB: number, toB: number): RichContentChangeKind {
  const deleted = toA > fromA;
  const inserted = toB > fromB;

  if (!deleted && inserted) return "addition";
  if (deleted && !inserted) return "deletion";
  return "replacement";
}

function isTipTapDoc(content: unknown): content is JSONContent {
  return (
    typeof content === "object" &&
    content !== null &&
    (content as JSONContent).type === "doc" &&
    Array.isArray((content as JSONContent).content)
  );
}

/**
 * Pure, DOM-independent semantic diff of two TipTap JSON documents.
 */
export function diffRichContent(schema: Schema, before: unknown, after: unknown): DiffRichContentResult {
  if (!isTipTapDoc(before) || !isTipTapDoc(after)) {
    return { ok: false, error: "parse_error" };
  }

  let beforeDoc;
  let afterDoc;

  try {
    beforeDoc = schema.nodeFromJSON(before);
    afterDoc = schema.nodeFromJSON(after);
  } catch {
    return { ok: false, error: "parse_error" };
  }

  const replacement = new StepMap([0, beforeDoc.content.size, afterDoc.content.size]);

  const changeSet = ChangeSet.create(beforeDoc, combineChangeMetadata, operatelyTokenEncoder).addSteps(
    afterDoc,
    [replacement],
    null,
  );

  const simplified = simplifyChanges(changeSet.changes, afterDoc);

  const changes: RichContentChange[] = simplified.map((change) => ({
    kind: classifyChange(change.fromA, change.toA, change.fromB, change.toB),
    fromA: change.fromA,
    toA: change.toA,
    fromB: change.fromB,
    toB: change.toB,
  }));

  return { ok: true, changes };
}
