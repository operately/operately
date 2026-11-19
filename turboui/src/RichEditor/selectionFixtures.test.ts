import { readFileSync } from "fs";
import { resolve } from "path";
import { getSchema, type JSONContent } from "@tiptap/core";
import { createRichEditorExtensions } from "./createRichEditorExtensions";

type Fixture = { name: string; content: JSONContent; selections: { from: number; to: number; quote: string }[] };
const fixtures: Fixture[] = JSON.parse(
  readFileSync(resolve(__dirname, "../../../app/test/fixtures/rich_text/selections.json"), "utf8"),
);
const schema = getSchema(createRichEditorExtensions({}, { editable: false }));

test.each(fixtures)("selection contract: $name", ({ content, selections }) => {
  const doc = schema.nodeFromJSON(content);
  for (const selection of selections) {
    expect(
      doc.textBetween(selection.from, selection.to, "\n", (node) => (node.type.name === "hardBreak" ? "\n" : "\uFFFC")),
    ).toBe(selection.quote);
  }
});
