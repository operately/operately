import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import RichContent from ".";

const content = {
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
const lookup = async () => null;

it("renders explicitly read-only task lists without an update callback", async () => {
  render(<RichContent content={content} mentionedPersonLookup={lookup} taskList={{ canEdit: false }} />);
  const checkbox = await screen.findByRole("checkbox", { name: "Review" });
  expect(checkbox).toBeDisabled();
  fireEvent.click(checkbox);
  expect(checkbox).not.toBeChecked();
});

it("renders disabled checkboxes without edit permission", async () => {
  const onChange = jest.fn();
  render(<RichContent content={content} mentionedPersonLookup={lookup} taskList={{ canEdit: false, onChange }} />);
  const checkbox = await screen.findByRole("checkbox", { name: "Review" });
  expect(checkbox).toBeDisabled();
  expect(checkbox).toHaveClass("cursor-not-allowed");
  fireEvent.click(checkbox);
  expect(onChange).not.toHaveBeenCalled();
});

it("optimistically checks, prevents duplicate saves, and sends the full source", async () => {
  let finish: () => void = () => {};
  const onChange = jest.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  render(<RichContent content={content} mentionedPersonLookup={lookup} taskList={{ canEdit: true, onChange }} />);
  const checkbox = await screen.findByRole("checkbox", { name: "Review" });
  expect(checkbox).toHaveClass("cursor-pointer");
  fireEvent.click(checkbox);
  await waitFor(() => expect(checkbox).toBeChecked());
  expect(checkbox).toBeDisabled();
  fireEvent.click(checkbox);
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith({ itemPath: [0, 0], checked: true, expectedContent: content });
  await act(async () => finish());
  await waitFor(() => expect(checkbox).toBeEnabled());
});

it("restores the checkbox after a failed save", async () => {
  const onChange = jest.fn().mockRejectedValue(new Error("conflict"));
  render(<RichContent content={content} mentionedPersonLookup={lookup} taskList={{ canEdit: true, onChange }} />);
  const checkbox = await screen.findByRole("checkbox", { name: "Review" });
  fireEvent.click(checkbox);
  await waitFor(() => expect(onChange).toHaveBeenCalled());
  await waitFor(() => expect(checkbox).not.toBeChecked());
  expect(checkbox).toBeEnabled();
});

it("retains optimistic state across equivalent source objects and accepts refreshed content", async () => {
  const props = {
    mentionedPersonLookup: lookup,
    taskList: { canEdit: true, onChange: jest.fn().mockResolvedValue(undefined) },
  };
  const view = render(<RichContent {...props} content={content} />);
  fireEvent.click(await screen.findByRole("checkbox"));
  await waitFor(() => expect(screen.getByRole("checkbox")).toBeEnabled());
  view.rerender(<RichContent {...props} content={JSON.parse(JSON.stringify(content))} />);
  expect(screen.getByRole("checkbox")).toBeChecked();
  const refreshed = JSON.parse(JSON.stringify(content));
  refreshed.content[0].content[0].content[0].content[0].text = "New content";
  view.rerender(<RichContent {...props} content={refreshed} />);
  await waitFor(() => expect(screen.getByRole("checkbox", { name: "New content" })).not.toBeChecked());
});

it("identifies nested items using the complete source path and blocks every checkbox while saving", async () => {
  const nested = {
    type: "doc",
    content: [
      {
        type: "taskList",
        content: [
          {
            type: "taskItem",
            attrs: { checked: false },
            content: [{ type: "paragraph", content: [{ type: "text", text: "Parent" }] }, ...content.content],
          },
        ],
      },
    ],
  };
  let finish = () => {};
  const onChange = jest.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  render(<RichContent content={nested} mentionedPersonLookup={lookup} taskList={{ canEdit: true, onChange }} />);
  fireEvent.click(await screen.findByRole("checkbox", { name: "Review" }));
  expect(onChange).toHaveBeenCalledWith({ itemPath: [0, 0, 1, 0], checked: true, expectedContent: nested });
  screen.getAllByRole("checkbox").forEach((checkbox) => expect(checkbox).toBeDisabled());
  await act(async () => finish());
});
