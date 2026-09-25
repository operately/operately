import tableFixtures from "../../../app/test/fixtures/rich_text/tables.json";
import type { JSONContent } from "@tiptap/core";
import React from "react";
import { render, waitFor } from "@testing-library/react";
import { Summary, summarize } from "./Summary";

describe("summarize", () => {
  it("keeps short text intact", () => {
    const input = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Contrary to popular belief" }],
        },
      ],
    };

    expect(summarize(input)).toEqual(input);
  });

  it("keeps mentions intact", () => {
    const input = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Hello " },
            { type: "mention", attrs: { label: "John Doe" } },
          ],
        },
      ],
    };

    expect(summarize(input)).toEqual(input);
  });

  it("joins paragraphs", () => {
    const input = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "World" }],
        },
      ],
    };

    expect(summarize(input)).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Hello" },
            { type: "text", text: " " },
            { type: "text", text: "World" },
          ],
        },
      ],
    });
  });

  it("joins bullet lists", () => {
    const input = {
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [{ type: "text", text: "Hello" }],
            },
            {
              type: "listItem",
              content: [{ type: "text", text: "World" }],
            },
          ],
        },
      ],
    };

    expect(summarize(input)).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "• Hello • World" }],
        },
      ],
    });
  });

  it("joins ordered lists", () => {
    const input = {
      type: "doc",
      content: [
        {
          type: "orderedList",
          content: [
            {
              type: "listItem",
              content: [{ type: "text", text: "Hello" }],
            },
            {
              type: "listItem",
              content: [{ type: "text", text: "World" }],
            },
          ],
        },
      ],
    };

    expect(summarize(input)).toEqual({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "1. Hello 2. World" }] }],
    });
  });

  it("converts headings to text", () => {
    const input = {
      type: "doc",
      content: [
        {
          type: "heading",
          content: [{ type: "text", text: "Hello" }],
          attrs: { level: 1 },
        },
      ],
    };

    expect(summarize(input)).toEqual({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Hello" }] }],
    });
  });

  it("handles blockquotes", () => {
    const input = {
      type: "doc",
      content: [
        {
          type: "blockquote",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "This is a quote" }],
            },
          ],
        },
      ],
    };

    expect(summarize(input)).toEqual({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "This is a quote" }] }],
    });
  });

  it("handles blockquotes with multiple paragraphs", () => {
    const input = {
      type: "doc",
      content: [
        {
          type: "blockquote",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "First paragraph" }],
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "Second paragraph" }],
            },
          ],
        },
      ],
    };

    expect(summarize(input)).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "First paragraph" },
            { type: "text", text: " " },
            { type: "text", text: "Second paragraph" },
          ],
        },
      ],
    });
  });

  it("keeps file blobs as preview nodes after the text", () => {
    const blob = {
      type: "blob",
      attrs: {
        src: "https://example.com/photo.png",
        alt: "photo.png",
        title: "photo.png",
        filetype: "image/png",
      },
    };

    const input = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "See attached" }],
        },
        {
          type: "paragraph",
          content: [blob],
        },
      ],
    };

    expect(summarize(input)).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "See attached" }],
        },
        {
          type: "paragraph",
          content: [blob],
        },
      ],
    });
  });

  it("normalizes legacy object blob sources to a URL string", () => {
    const input = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "blob",
              attrs: {
                src: { id: "blob-1", url: "https://example.com/photo.png" },
                filetype: "image/png",
              },
            },
          ],
        },
      ],
    };

    expect(summarize(input)).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "blob",
              attrs: {
                id: "blob-1",
                src: "https://example.com/photo.png",
                filetype: "image/png",
              },
            },
          ],
        },
      ],
    });
  });

  it("keeps an image blob even when it has no title", () => {
    const blob = {
      type: "blob",
      attrs: {
        src: "https://example.com/photo.png",
        filetype: "image/png",
      },
    };

    const input = {
      type: "doc",
      content: [{ type: "paragraph", content: [blob] }],
    };

    expect(summarize(input)).toEqual({
      type: "doc",
      content: [{ type: "paragraph", content: [blob] }],
    });
  });
});

it("keeps nested task states, mentions, and attachments in summaries", () => {
  const result = summarize({
    type: "doc",
    content: [
      {
        type: "taskList",
        content: [
          {
            type: "taskItem",
            attrs: { checked: true },
            content: [
              {
                type: "paragraph",
                content: [
                  { type: "mention", attrs: { id: "alice", label: "Alice" } },
                  { type: "blob", attrs: { id: "file", src: "/file.pdf", filetype: "application/pdf" } },
                ],
              },
              {
                type: "taskList",
                content: [
                  {
                    type: "taskItem",
                    attrs: { checked: false },
                    content: [{ type: "paragraph", content: [{ type: "text", text: "Review" }] }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });
  const json = JSON.stringify(result);
  expect(json).toContain("☑");
  expect(json).toContain("☐");
  expect(json).toContain('"type":"mention"');
  expect(json).toContain('"type":"blob"');
});

it.each(tableFixtures)("summarizes tables as inline text: $name", ({ document, tableText }) => {
  const result: JSONContent = summarize(document);
  const inline = (result.content ?? []).flatMap((node) => node.content ?? []);
  expect(inline.every((node) => node.type === "text" || node.type === "mention")).toBe(true);
  const text = inline.map((node) => (node.type === "mention" ? node.attrs?.label : node.text)).join("");
  expect(text).toBe(`Before ${tableText.replace(/\n/g, " / ")} After`);
  if (tableText.includes("Alice Smith")) {
    expect(inline).toContainEqual({ type: "mention", attrs: { id: "alice", label: "Alice Smith" } });
  }
});

it("renders a truncated table summary through the current editor schema", async () => {
  const fixture = tableFixtures[0];
  if (!fixture) throw new Error("Table fixture is required");
  const { container } = render(
    <Summary content={fixture.document} characterCount={30} mentionedPersonLookup={async () => null} />,
  );
  await waitFor(() => expect(container.textContent).toContain("Name | Notes"));
  expect(container.textContent).toContain("...");
  expect(container.querySelector("table")).toBeNull();
  expect(container.querySelector('[contenteditable="true"]')).toBeNull();
});
