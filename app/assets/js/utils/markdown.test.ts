import tableFixtures from "../../../test/fixtures/rich_text/tables.json";
import { exportToMarkdown } from "./markdown";

it("exports task states, nesting, links, mentions and attachments", () => {
  const result = exportToMarkdown({
    type: "doc",
    content: [
      {
        type: "taskList",
        content: [
          {
            type: "taskItem",
            attrs: { checked: true },
            content: [
              { type: "paragraph", content: [{ type: "text", text: "Done", marks: [{ type: "bold" }] }] },
              {
                type: "taskList",
                content: [
                  {
                    type: "taskItem",
                    attrs: { checked: false },
                    content: [
                      {
                        type: "paragraph",
                        content: [
                          { type: "mention", attrs: { label: "Alice" } },
                          {
                            type: "text",
                            text: " review ",
                            marks: [{ type: "link", attrs: { href: "https://example.com" } }],
                          },
                          {
                            type: "blob",
                            attrs: { filetype: "application/pdf", alt: "Notes", src: "https://example.com/file.pdf" },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });
  expect(result).toContain("- [x] **Done**");
  expect(result).toMatch(/\n\s+- \[ \]/);
  expect(result).toContain("@Alice");
  expect(result).toContain("https://example.com");
  expect(result).toContain("[Notes](https://example.com/file.pdf)");
});

it.each(tableFixtures)("exports tables: $name", ({ document, markdown }) => {
  expect(exportToMarkdown(document)).toBe(markdown);
});
