import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Editor, useEditor } from "..";
import { GlobalSearch } from "../../GlobalSearch";

function Harness({ compact = false, hideToolbar = false, content = "" }) {
  const editor = useEditor({
    handlers: { mentionedPersonLookup: async () => null, resolveResourceLinks: null },
    content,
  });

  return (
    <>
      <input aria-label="Title" />
      <Editor editor={editor} compactToolbar={compact} hideToolbar={hideToolbar} />
    </>
  );
}

it("tabs from the title directly to the body and back", async () => {
  const user = userEvent.setup();
  const { container } = render(<Harness />);
  const title = screen.getByRole("textbox", { name: "Title" });

  await user.click(title);
  await user.tab();
  expect(container.querySelector('[contenteditable="true"]')).toHaveFocus();

  await user.tab({ shift: true });
  expect(title).toHaveFocus();
});

it.each([
  ["Ctrl+K", { ctrlKey: true }, false],
  ["Cmd+K", { metaKey: true }, true],
])(
  "opens the link editor with %s and still opens search outside the editor",
  async (_shortcut, modifiers, hideToolbar) => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <GlobalSearch search={async () => ({})} onNavigate={jest.fn()} />
        <Harness hideToolbar={hideToolbar} />
      </>,
    );
    const title = screen.getByRole("textbox", { name: "Title" });
    const shortcut = { key: "k", keyCode: 75, ...modifiers };

    await user.click(title);
    await user.tab();
    expect(document.activeElement).toBe(container.querySelector('[contenteditable="true"]'));
    fireEvent.keyDown(document.activeElement ?? document, shortcut);

    expect(container.querySelector("[data-link-edit-form] input")).toHaveFocus();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();

    await user.click(title);
    fireEvent.keyDown(title, shortcut);
    await waitFor(() => expect(screen.getByRole("combobox")).toHaveFocus());
  },
);

it("inserts a link at the caret on the first Enter without submitting the surrounding form", async () => {
  const submit = jest.fn((event: React.FormEvent) => event.preventDefault());
  const user = userEvent.setup();
  const { container } = render(
    <form onSubmit={submit}>
      <Harness />
    </form>,
  );

  await user.click(screen.getByRole("textbox", { name: "Title" }));
  await user.tab();
  fireEvent.keyDown(document.activeElement ?? document, { key: "k", keyCode: 75, ctrlKey: true });

  const input = screen.getByPlaceholderText("ex. https://example.com");
  await user.type(input, "example.com{Enter}");

  expect(screen.getByRole("link", { name: "example.com" })).toHaveAttribute("href", "https://example.com");
  expect(container.querySelector("[data-link-edit-form]")).not.toBeInTheDocument();
  expect(submit).not.toHaveBeenCalled();
});

it("dismisses the link form on Escape and clears the temporary highlight from the original selection", async () => {
  const user = userEvent.setup();
  const { container } = render(<Harness content="<p>Selected text</p>" />);
  const editor = container.querySelector<HTMLElement>('[contenteditable="true"]');
  if (!editor) throw new Error("The rich-text editor did not mount");
  const paragraph = screen.getByText("Selected text");

  await user.click(screen.getByRole("textbox", { name: "Title" }));
  await user.tab();
  const range = document.createRange();
  range.selectNodeContents(paragraph);
  document.getSelection()?.removeAllRanges();
  document.getSelection()?.addRange(range);
  fireEvent(document, new Event("selectionchange"));
  fireEvent.keyDown(editor, { key: "k", keyCode: 75, ctrlKey: true });

  const input = screen.getByPlaceholderText("ex. https://example.com");
  expect(editor.querySelector("[data-editor-selection]")).toHaveTextContent("Selected text");
  await user.keyboard("{Escape}");

  expect(input).not.toBeInTheDocument();
  await waitFor(() => expect(editor).toHaveFocus());
  expect(editor.querySelector("mark, [data-editor-selection]")).not.toBeInTheDocument();
  expect(editor).toHaveTextContent("Selected text");
});

it("keeps table insertion and Markdown help reachable in the compact toolbar popup", async () => {
  const user = userEvent.setup();
  render(<Harness compact />);

  await user.click(screen.getByRole("button", { name: "More formatting options" }));
  expect(screen.getByRole("button", { name: "Table" })).toHaveFocus();

  await user.tab();
  expect(screen.getByRole("button", { name: "Markdown shortcuts" })).toHaveFocus();

  await user.keyboard("{Enter}");
  expect(screen.getByRole("button", { name: "Close" })).toBeVisible();
});

it("inserts an editable Mermaid diagram block", async () => {
  const user = userEvent.setup();
  const { container } = render(<Harness />);

  await user.click(screen.getByRole("button", { name: "Insert diagram" }));

  await waitFor(() => {
    const editor = container.querySelector('[contenteditable="true"]');
    expect(editor).toHaveTextContent("");
    expect(container.querySelector('[data-language="mermaid"]')).toBeInTheDocument();
  });
});
