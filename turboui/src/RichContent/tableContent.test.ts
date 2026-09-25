import tableFixtures from "../../../app/test/fixtures/rich_text/tables.json";
import { tableContentToInline } from "./tableContent";

it.each(tableFixtures)("flattens $name without changing the source", ({ document, tableText }) => {
  const table = document.content.find((node) => node.type === "table");
  if (!table) throw new Error("Fixture must contain a table");
  const original = JSON.stringify(table);
  const inline = tableContentToInline(table, "\n");
  expect(inline.map((node) => (node.type === "mention" ? node.attrs?.label : node.text)).join("")).toBe(tableText);
  expect(JSON.stringify(table)).toBe(original);
});
