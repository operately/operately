import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";

import { PageDescription } from ".";

const emptyDoc = { type: "doc", content: [{ type: "paragraph" }] };
const descriptionDoc = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "Hello world" }] }],
};

const richTextHandlers = {
  mentionedPersonLookup: jest.fn(),
  mentionSearchScope: { type: "none" as const },
  onUpload: jest.fn(),
};

describe("PageDescription", () => {
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
});
