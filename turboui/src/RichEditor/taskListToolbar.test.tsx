import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Editor, useEditor } from ".";
import { MemoryRouter } from "react-router";
import { NewDocumentPage } from "../NewDocumentPage";

beforeAll(() => {
  Range.prototype.getClientRects = () => document.createElement("div").getClientRects();
  Range.prototype.getBoundingClientRect = () => document.createElement("div").getBoundingClientRect();
});

function TestEditor({ content }: { content: string }) {
  const editor = useEditor({ content, handlers: { mentionedPersonLookup: async () => null } });
  return <Editor editor={editor} />;
}

it.each(["<p></p>", "<p>Review the release</p>"])("creates a checkbox from the toolbar in %s", async (content) => {
  render(<TestEditor content={content} />);
  fireEvent.click(screen.getByTitle("Task list"));
  expect(await screen.findByRole("checkbox")).not.toBeChecked();
});

it("creates a checkbox in the new document form", async () => {
  render(
    <MemoryRouter>
      <NewDocumentPage
        pageTitle="New Document"
        navigation={[]}
        richTextHandlers={{ mentionedPersonLookup: async () => null }}
        cancelLink="/"
        hideSubscriptions
        onSubmit={jest.fn().mockResolvedValue(true)}
      />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByTitle("Task list"));
  expect(await screen.findByRole("checkbox")).not.toBeChecked();
});
