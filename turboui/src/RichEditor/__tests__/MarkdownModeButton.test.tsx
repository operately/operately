import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

import { MarkdownModeButton } from "../components/MarkdownModeButton";
import { EditorContext } from "../EditorContext";
import { EditorState, MarkdownHintsPreference } from "../useEditor";

function renderButton(markdownHints?: MarkdownHintsPreference) {
  const ctx = { markdownHints } as unknown as EditorState;

  return render(
    <EditorContext.Provider value={ctx}>
      <MarkdownModeButton iconSize={20} />
    </EditorContext.Provider>,
  );
}

describe("MarkdownModeButton", () => {
  it("renders nothing when the preference is not wired", () => {
    const { container } = renderButton(undefined);
    expect(container.firstChild).toBeNull();
  });

  it("reflects the active (enabled) state", () => {
    renderButton({ enabled: true, onToggle: jest.fn() });

    const button = screen.getByRole("button", { name: "Markdown shortcuts" });
    expect(button.className).toContain("bg-toggle-active");
  });

  it("reflects the inactive (disabled) state", () => {
    renderButton({ enabled: false, onToggle: jest.fn() });

    const button = screen.getByRole("button", { name: "Markdown shortcuts" });
    expect(button.className).not.toContain("bg-toggle-active");
    expect(button.className).toContain("hover:bg-surface-highlight");
  });

  it("invokes the toggle handler (mutation) on click", () => {
    const onToggle = jest.fn();
    renderButton({ enabled: false, onToggle });

    fireEvent.click(screen.getByRole("button", { name: "Markdown shortcuts" }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
