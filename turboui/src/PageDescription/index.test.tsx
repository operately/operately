import React from "react";
import { render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { PageDescription } from ".";

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
const richTextHandlers = {
  mentionedPersonLookup: jest.fn(),
  mentionSearchScope: { type: "none" as const },
  onUpload: jest.fn(),
};

describe("PageDescription", () => {
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
