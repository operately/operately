import tableFixtures from "../../../test/fixtures/rich_text/tables.json";
import { exportToMarkdown } from "./markdown";

it("keeps each table row inside its enclosing blockquote", () => {
  const fixture = tableFixtures[0];
  if (!fixture) throw new Error("Table fixture is required");
  const table = fixture.document.content.find((node) => node.type === "table");
  if (!table) throw new Error("Fixture must contain a table");
  const expected = fixture.markdown.replace(/^Before\n\n/, "").replace(/\n\nAfter$/, "");
  const doc = { type: "doc", content: [{ type: "blockquote", content: [table] }] };
  expect(exportToMarkdown(doc)).toBe(
    expected
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n"),
  );
});
