import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import type { Editor as TiptapEditor } from "@tiptap/core";
import { Editor, Content, useEditor } from "..";
import { assertPresent } from "../../utils/assertions";

function settingsButton(index: number) {
  const button = screen.getAllByRole("button", { name: "Table settings" })[index];
  assertPresent(button);
  return button;
}

let editor: TiptapEditor;
const table = (text: string) => ({
  type: "table",
  content: [
    {
      type: "tableRow",
      content: [{ type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text }] }] }],
    },
  ],
});
const content = { type: "doc", content: [table("First table"), { type: "paragraph" }, table("Second table")] };
function Harness({ readonly = false, display = false }) {
  const state = useEditor({ content, editable: !readonly, handlers: { mentionedPersonLookup: async () => null } });
  React.useEffect(() => {
    editor = state.editor;
  }, [state.editor]);
  return display ? <Content editor={state} /> : <Editor editor={state} />;
}

beforeAll(() => {
  Range.prototype.getClientRects = () => document.createElement("div").getClientRects();
  Range.prototype.getBoundingClientRect = () => document.createElement("div").getBoundingClientRect();
});

it("always shows one settings button per table without changing stored content", () => {
  render(<Harness />);
  expect(screen.getAllByRole("button", { name: "Table settings" })).toHaveLength(2);
  expect(editor.getText()).not.toContain("Table settings");
  expect(editor.getHTML()).not.toContain("table-settings");
});

it("toggles only the chosen table's header regardless of the text cursor", async () => {
  const user = userEvent.setup();
  const { container } = render(<Harness />);
  act(() => editor.commands.setTextSelection(editor.state.doc.content.size - 3));
  const original = editor.getJSON();
  await user.click(settingsButton(0));
  await user.click(screen.getByRole("menuitem", { name: "Remove header row" }));
  expect(container.querySelectorAll("table")[0]?.querySelector("th")).toBeNull();
  expect(container.querySelectorAll("table")[1]?.querySelector("th")).not.toBeNull();
  await waitFor(() => expect(editor.isFocused).toBe(true));
  act(() => editor.commands.undo());
  expect(editor.getJSON()).toEqual(original);
  act(() => editor.commands.redo());
  await user.click(settingsButton(0));
  await user.click(screen.getByRole("menuitem", { name: "Add header row" }));
  expect(editor.getJSON()).toEqual(original);
});

it("deletes only the chosen table and restores it with native Undo", async () => {
  const user = userEvent.setup();
  const { container } = render(<Harness />);
  const original = editor.getJSON();
  await user.click(settingsButton(1));
  await user.click(screen.getByRole("menuitem", { name: "Delete table" }));
  expect(container.querySelectorAll("table")).toHaveLength(1);
  expect(container.querySelector("table")).toHaveTextContent("First table");
  await waitFor(() => expect(editor.isFocused).toBe(true));
  act(() => editor.commands.undo());
  expect(editor.getJSON()).toEqual(original);
  expect(screen.getAllByRole("button", { name: "Table settings" })).toHaveLength(2);
});

it("supports keyboard opening and dismissal without moving the text selection", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  const button = settingsButton(0);
  const selection = editor.state.selection;
  act(() => button.focus());
  await user.keyboard("{Enter}");
  expect(screen.getByRole("menu")).toBeInTheDocument();
  await user.keyboard("{Escape}");
  await waitFor(() => expect(button).toHaveFocus());
  expect(editor.state.selection.eq(selection)).toBe(true);
});

it.each([{ readonly: true }, { display: true }])("hides settings in read-only rendering: %j", (props) => {
  render(<Harness {...props} />);
  expect(screen.queryByRole("button", { name: "Table settings" })).not.toBeInTheDocument();
});

it("removes controls when editing is disabled or content is replaced", () => {
  render(<Harness />);
  act(() => editor.setEditable(false));
  expect(screen.queryByRole("button", { name: "Table settings" })).not.toBeInTheDocument();
  act(() => editor.setEditable(true));
  expect(screen.getAllByRole("button", { name: "Table settings" })).toHaveLength(2);
  act(() => editor.commands.setContent({ type: "doc", content: [{ type: "paragraph" }] }));
  expect(screen.queryByRole("button", { name: "Table settings" })).not.toBeInTheDocument();
});

it("refreshes settings after a silent content replacement", () => {
  render(<Harness />);
  act(() => editor.commands.setContent({ type: "doc", content: [table("Replacement")] }, { emitUpdate: false }));
  expect(screen.getAllByRole("button", { name: "Table settings" })).toHaveLength(1);
  act(() => editor.commands.setContent(content, { emitUpdate: false }));
  expect(screen.getAllByRole("button", { name: "Table settings" })).toHaveLength(2);
});
