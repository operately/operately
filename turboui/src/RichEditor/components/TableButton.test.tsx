import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import type { Editor as TiptapEditor } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import { Editor, useEditor } from "..";

let editor: TiptapEditor;
function Harness({ compact = false, editable = true }) {
  const state = useEditor({ handlers: { mentionedPersonLookup: async () => null }, editable });
  React.useEffect(() => {
    editor = state.editor;
  }, [state.editor]);
  return <Editor editor={state} compactToolbar={compact} />;
}

beforeAll(() => {
  Range.prototype.getClientRects = () => document.createElement("div").getClientRects();
  Range.prototype.getBoundingClientRect = () => document.createElement("div").getBoundingClientRect();
});

it.each([false, true])("always inserts a table without a menu (compact: %s)", async (compact) => {
  const user = userEvent.setup();
  const { container } = render(<Harness compact={compact} />);
  if (compact) await user.click(screen.getByRole("button", { name: "More formatting options" }));
  await user.click(await screen.findByRole("button", { name: "Table" }));
  expect(container.querySelectorAll("tr")).toHaveLength(3);
  expect(container.querySelectorAll("th")).toHaveLength(3);
  await waitFor(() => expect(editor.isFocused).toBe(true));
  act(() => editor.commands.insertContent("Original cell"));
  const original = editor.getJSON();
  if (compact) await user.click(screen.getByRole("button", { name: "More formatting options" }));
  await user.click(screen.getByRole("button", { name: "Table" }));
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  expect(container.querySelectorAll("table")).toHaveLength(2);
  expect(container.querySelector("table table")).not.toBeInTheDocument();
  expect(container.querySelector("table")).toHaveTextContent("Original cell");
  await waitFor(() => expect(editor.isFocused).toBe(true));
  act(() => editor.commands.undo());
  expect(editor.getJSON()).toEqual(original);
});

it("adds after a selected table without replacing it", async () => {
  const user = userEvent.setup();
  const { container } = render(<Harness />);
  await user.click(await screen.findByRole("button", { name: "Table" }));
  act(() => editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, 0))));
  await user.click(screen.getByRole("button", { name: "Table" }));
  expect(container.querySelectorAll("table")).toHaveLength(2);
});

it("supports keyboard insertion", async () => {
  const user = userEvent.setup();
  const { container } = render(<Harness />);
  act(() => screen.getByRole("button", { name: "Table" }).focus());
  await user.keyboard("{Enter}");
  expect(container.querySelector("table")).toBeInTheDocument();
});

it("hides table controls in read-only content", () => {
  render(<Harness editable={false} />);
  expect(screen.queryByRole("button", { name: "Table" })).not.toBeInTheDocument();
});
