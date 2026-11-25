// A shared document sample for comparing editable, published, and compact prose.
const text = (value: string) => ({ type: "text", text: value });
const paragraph = (value: string) => ({ type: "paragraph", content: [text(value)] });
const heading = (level: number, value: string) => ({ type: "heading", attrs: { level }, content: [text(value)] });
const listItem = (value: string, children: object[] = []) => ({
  type: "listItem",
  content: [paragraph(value), ...children],
});

export const richTextTypographyContent = {
  type: "doc",
  content: [
    heading(1, "Launch plan"),
    paragraph("This opening paragraph follows the first heading and includes ordinary body text."),
    paragraph("A second paragraph establishes the normal space between paragraphs."),
    heading(2, "Preparation"),
    paragraph("The preparation section begins here."),
    heading(3, "Checklist"),
    paragraph("The checklist introduces both list styles."),
    {
      type: "bulletList",
      content: [
        listItem("Review the draft", [{ type: "bulletList", content: [listItem("Check the links")] }]),
        listItem("Share with the team"),
      ],
    },
    paragraph("This paragraph follows the bullet list."),
    {
      type: "orderedList",
      content: [listItem("Confirm the date"), listItem("Publish the update")],
    },
    paragraph("This paragraph follows the numbered list."),
    heading(4, "Notes"),
    paragraph("The notes section uses a smaller heading."),
    { type: "blockquote", content: [paragraph("Keep the announcement short."), paragraph("Ask for feedback early.")] },
    paragraph("This paragraph follows the quotation."),
    { type: "codeBlock", attrs: { language: "text" }, content: [text("status = ready\nowner = team")] },
    paragraph("This paragraph follows the code block, with a bold word: "),
    {
      type: "taskList",
      content: [{ type: "taskItem", attrs: { checked: false }, content: [paragraph("Verify the release notes")] }],
    },
    {
      type: "paragraph",
      content: [text("The final decision is "), { ...text("ready"), marks: [{ type: "bold" }] }, text(".")],
    },
    {
      type: "table",
      content: [
        {
          type: "tableRow",
          content: [
            { type: "tableCell", content: [paragraph("First cell paragraph"), paragraph("Second cell paragraph")] },
            { type: "tableCell", content: [paragraph("Compact table cell")] },
          ],
        },
      ],
    },
  ],
};
