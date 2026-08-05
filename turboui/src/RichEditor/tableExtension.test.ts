import { Editor } from "@tiptap/core";

import { createRichEditorExtensions } from "./createRichEditorExtensions";

const handlers = {
  mentionedPersonLookup: async () => null,
  uploadFile: async () => ({ id: "1", url: "u" }),
} as any;

function makeEditor(): Editor {
  return new Editor({
    element: document.createElement("div"),
    extensions: createRichEditorExtensions(handlers, { editable: true }),
  });
}

describe("RichEditor table support", () => {
  it("inserts a table with a header row via the toolbar command", () => {
    const editor = makeEditor();

    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();

    const table = editor.getJSON().content?.[0];
    expect(table?.type).toBe("table");
    expect(table?.content?.length).toBe(3);

    const [firstRow, secondRow] = table!.content!;
    expect(firstRow.content?.map((cell: any) => cell.type)).toEqual(["tableHeader", "tableHeader", "tableHeader"]);
    expect(secondRow.content?.every((cell: any) => cell.type === "tableCell")).toBe(true);
  });

  it("round-trips stored table content through the schema", () => {
    const editor = makeEditor();

    editor.commands.setContent({
      type: "doc",
      content: [
        {
          type: "table",
          content: [
            {
              type: "tableRow",
              content: [
                { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "H" }] }] },
              ],
            },
            {
              type: "tableRow",
              content: [
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "c" }] }] },
              ],
            },
          ],
        },
      ],
    });

    const html = editor.getHTML();
    expect(html).toContain("<table");
    expect(html).toContain("<th");
    expect(html).toContain("<td");
    expect(editor.getJSON().content?.[0]?.type).toBe("table");
  });
});
