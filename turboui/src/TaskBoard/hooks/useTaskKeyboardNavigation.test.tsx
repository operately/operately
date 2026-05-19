import React from "react";
import { fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom";

import { useTaskKeyboardNavigation } from "./useTaskKeyboardNavigation";

describe("useTaskKeyboardNavigation", () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  it("selects the first task with j and moves down/up with j/k", () => {
    const { getByTestId } = render(<KeyboardNavigationHarness />);

    fireTaskKey("j", 74);
    expect(getByTestId("task-one")).toHaveAttribute("data-selected", "true");

    fireTaskKey("j", 74);
    expect(getByTestId("task-two")).toHaveAttribute("data-selected", "true");

    fireTaskKey("k", 75);
    expect(getByTestId("task-one")).toHaveAttribute("data-selected", "true");
  });

  it("ignores shortcuts from unrelated interactive controls", () => {
    const { getByTestId } = render(<KeyboardNavigationHarness />);

    fireEvent.keyDown(getByTestId("outside-button"), { key: "j", keyCode: 74, which: 74 });

    expect(getByTestId("task-one")).toHaveAttribute("data-selected", "false");
    expect(getByTestId("task-two")).toHaveAttribute("data-selected", "false");
  });

  it("ignores shortcuts from editable fields", () => {
    const { getByTestId } = render(<KeyboardNavigationHarness />);

    fireEvent.keyDown(getByTestId("task-input"), { key: "j", keyCode: 74, which: 74 });

    expect(getByTestId("task-one")).toHaveAttribute("data-selected", "false");
    expect(getByTestId("task-two")).toHaveAttribute("data-selected", "false");
  });

  it("clears the selected task with escape", () => {
    const { getByTestId } = render(<KeyboardNavigationHarness />);

    fireTaskKey("j", 74);
    expect(getByTestId("task-one")).toHaveAttribute("data-selected", "true");

    fireTaskKey("Escape", 27);
    expect(getByTestId("task-one")).toHaveAttribute("data-selected", "false");
    expect(getByTestId("task-two")).toHaveAttribute("data-selected", "false");
  });

  it("exposes clearSelection for transitions like opening the inline creator", () => {
    const { getByTestId } = render(<KeyboardNavigationHarness />);

    fireTaskKey("j", 74);
    expect(getByTestId("task-one")).toHaveAttribute("data-selected", "true");

    fireEvent.click(getByTestId("clear-selection"));
    expect(getByTestId("task-one")).toHaveAttribute("data-selected", "false");
  });
});

function KeyboardNavigationHarness() {
  const { containerRef, selectedTaskId, clearSelection } = useTaskKeyboardNavigation<HTMLDivElement>();

  return (
    <>
      <button data-testid="outside-button">Outside control</button>
      <div ref={containerRef} data-testid="task-container">
        <input data-testid="task-input" />
        <button data-testid="clear-selection" onClick={clearSelection}>
          Clear
        </button>
        {["one", "two"].map((id) => (
          <div
            key={id}
            data-task-row-id={id}
            data-testid={`task-${id}`}
            data-selected={selectedTaskId === id ? "true" : "false"}
            tabIndex={-1}
          >
            {id}
          </div>
        ))}
      </div>
    </>
  );
}

function fireTaskKey(key: "j" | "k" | "Escape", keyCode: number) {
  fireEvent.keyDown(document, { key, keyCode, which: keyCode });
  fireEvent.keyUp(document, { key, keyCode, which: keyCode });
}
