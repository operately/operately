import React from "react";
import { render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { PageDescription } from ".";
import { normalizeRichTextContent } from "../RichEditor/useEditor";

const emptyDoc = { type: "doc", content: [{ type: "paragraph" }] };
const descriptionDoc = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "Hello world" }] }],
};
const descriptionWithEmptyTextNodes = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        { type: "text", text: "" },
        { type: "text", text: "First paragraph from the API." },
      ],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Second paragraph from the API." },
        { type: "text", text: "" },
      ],
    },
  ],
};
const validRichDescription = {
  type: "doc",
  content: [
    { type: "paragraph" },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Hello ", marks: [{ type: "bold" }] },
        {
          type: "mention",
          attrs: { id: "jane-doe-abc123", label: "Jane Doe" },
          marks: [{ type: "bold" }],
        },
      ],
    },
  ],
};

const richTextHandlers = {
  mentionedPersonLookup: jest.fn(),
  mentionSearchScope: { type: "none" as const },
  onUpload: jest.fn(),
};

describe("PageDescription", () => {
  it("removes empty text nodes without mutating the source document", () => {
    expect(normalizeRichTextContent(descriptionWithEmptyTextNodes)).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "First paragraph from the API." }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Second paragraph from the API." }],
        },
      ],
    });
    expect(descriptionWithEmptyTextNodes.content[0].content[0]).toEqual({ type: "text", text: "" });
  });

  it("renders meaningful content alongside empty text nodes", async () => {
    const { container } = render(
      <PageDescription
        description={descriptionWithEmptyTextNodes}
        onDescriptionChange={jest.fn()}
        richTextHandlers={richTextHandlers}
        label="Notes"
        testId="description"
        emptyTestId="empty-description"
        canEdit
      />,
    );

    await waitFor(() => {
      expect(container.querySelector('[data-test-id="description"]')).toHaveTextContent(
        "First paragraph from the API.",
      );
      expect(container.querySelector('[data-test-id="description"]')).toHaveTextContent(
        "Second paragraph from the API.",
      );
    });
  });

  it("renders a description that arrives after the component mounted empty", () => {
    const { container, rerender } = render(
      <PageDescription
        description={emptyDoc}
        onDescriptionChange={jest.fn()}
        richTextHandlers={richTextHandlers}
        label="Notes"
        testId="description"
        emptyTestId="empty-description"
        canEdit
      />,
    );

    expect(container.querySelector('[data-test-id="empty-description"]')).toBeInTheDocument();

    rerender(
      <PageDescription
        description={descriptionDoc}
        onDescriptionChange={jest.fn()}
        richTextHandlers={richTextHandlers}
        label="Notes"
        testId="description"
        emptyTestId="empty-description"
        canEdit
      />,
    );

    expect(container.querySelector('[data-test-id="description"]')).toHaveTextContent("Hello world");
  });

  it("renders meaningful content when an existing description is replaced", async () => {
    const { container, rerender } = render(
      <PageDescription
        description={descriptionDoc}
        onDescriptionChange={jest.fn()}
        richTextHandlers={richTextHandlers}
        label="Notes"
        testId="description"
        canEdit
      />,
    );

    rerender(
      <PageDescription
        description={descriptionWithEmptyTextNodes}
        onDescriptionChange={jest.fn()}
        richTextHandlers={richTextHandlers}
        label="Notes"
        testId="description"
        canEdit
      />,
    );

    await waitFor(() => {
      expect(container.querySelector('[data-test-id="description"]')).toHaveTextContent(
        "First paragraph from the API.",
      );
      expect(container.querySelector('[data-test-id="description"]')).toHaveTextContent(
        "Second paragraph from the API.",
      );
    });
  });

  it("leaves valid rich text, empty paragraphs, mentions, attributes, and marks unchanged", () => {
    expect(normalizeRichTextContent(validRichDescription)).toBe(validRichDescription);
  });

  it.each([null, { type: "doc", content: [] }, emptyDoc])(
    "uses the zero state for an empty description",
    (description) => {
      const { container } = render(
        <PageDescription
          description={description}
          onDescriptionChange={jest.fn()}
          richTextHandlers={richTextHandlers}
          label="Notes"
          testId="description"
          emptyTestId="empty-description"
          canEdit
        />,
      );

      expect(container.querySelector('[data-test-id="empty-description"]')).toBeInTheDocument();
      expect(container.querySelector('[data-test-id="description"]')).not.toBeInTheDocument();
    },
  );
});
