import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Editor, useEditor } from "..";

function Harness({ compact = false }) {
  const editor = useEditor({
    handlers: { mentionedPersonLookup: async () => null, resolveResourceLinks: null },
  });

  return (
    <>
      <input aria-label="Title" />
      <Editor editor={editor} compactToolbar={compact} />
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
