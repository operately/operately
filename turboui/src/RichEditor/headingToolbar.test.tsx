import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Editor, useEditor } from ".";

beforeAll(() => {
  Range.prototype.getClientRects = () => document.createElement("div").getClientRects();
  Range.prototype.getBoundingClientRect = () => document.createElement("div").getBoundingClientRect();
});

function TestEditor({ compact }: { compact: boolean }) {
  const editor = useEditor({
    content: "<p>Section title</p>",
    handlers: {
      resolveResourceLinks: null,
      mentionedPersonLookup: async () => null,
      uploadFile: async () => ({ id: "file", url: "https://example.com/file" }),
    },
  });
  return <Editor editor={editor} compactToolbar={compact} />;
}

describe.each([false, true])("heading toolbar (compact: %s)", (compact) => {
  it("offers H2, H3, and H4 without H1", () => {
    render(<TestEditor compact={compact} />);
    expect(screen.queryByTitle("Heading 1")).not.toBeInTheDocument();
    for (const level of [2, 3, 4]) {
      expect(screen.getByTitle(`Heading ${level}`)).toBeVisible();
    }
  });

  it.each([2, 3, 4])("toggles H%i and returns to a paragraph", async (level) => {
    render(<TestEditor compact={compact} />);
    const button = screen.getByTitle(`Heading ${level}`);
    fireEvent.click(button);
    expect(await screen.findByRole("heading", { level })).toHaveTextContent("Section title");
    expect(button).toHaveClass("bg-toggle-active");

    fireEvent.click(button);
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.getByText("Section title").tagName).toBe("P");
    expect(button).not.toHaveClass("bg-toggle-active");
  });
});
