import React from "react";
import { render, waitFor, fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { PageDescription } from ".";

beforeAll(() => {
  Range.prototype.getClientRects = () => document.createElement("div").getClientRects();
  Range.prototype.getBoundingClientRect = () => document.createElement("div").getBoundingClientRect();
});

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
  taskList: { canEdit: false as const },
  onCommentTaskItemChange: null,
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

it("keeps checkbox edits unsaved until Save and discards them on Cancel", async () => {
  const description = {
    type: "doc",
    content: [
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
  };
  const onDescriptionChange = jest.fn().mockResolvedValue(true);
  const onChange = jest.fn();
  render(
    <PageDescription
      description={description}
      onDescriptionChange={onDescriptionChange}
      richTextHandlers={{ ...richTextHandlers, taskList: { canEdit: true, onChange } }}
      label="Notes"
      canEdit
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Edit" }));
  fireEvent.click(await screen.findByRole("checkbox"));
  await waitFor(() => expect(screen.getByRole("checkbox")).toBeChecked());
  expect(onChange).not.toHaveBeenCalled();
  expect(onDescriptionChange).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  await waitFor(() => expect(screen.getByRole("checkbox")).not.toBeChecked());
  fireEvent.click(screen.getByRole("button", { name: "Edit" }));
  fireEvent.click(await screen.findByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(onDescriptionChange).toHaveBeenCalled());
  expect(onDescriptionChange.mock.calls[0][0].content[0].content[0].attrs.checked).toBe(true);
  expect(onChange).not.toHaveBeenCalled();
});

it("keeps long task descriptions structurally complete in view mode", async () => {
  const description = {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Long description ".repeat(100) }] },
      {
        type: "taskList",
        content: [
          {
            type: "taskItem",
            attrs: { checked: false },
            content: [{ type: "paragraph", content: [{ type: "text", text: "Last item" }] }],
          },
        ],
      },
    ],
  };
  const onChange = jest.fn().mockResolvedValue(undefined);
  render(
    <PageDescription
      description={description}
      onDescriptionChange={jest.fn()}
      richTextHandlers={{ ...richTextHandlers, taskList: { canEdit: true, onChange } }}
      label="Notes"
      canEdit
    />,
  );
  fireEvent.click(await screen.findByRole("checkbox", { name: "Last item" }));
  expect(onChange).toHaveBeenCalledWith({ itemPath: [1, 0], checked: true, expectedContent: description });
});
