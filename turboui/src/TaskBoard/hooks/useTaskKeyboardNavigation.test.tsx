import React from "react";
import { fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom";

import {
  OPEN_TASK_ASSIGNEE_EVENT,
  OPEN_TASK_DUE_DATE_EVENT,
  OPEN_TASK_STATUS_EVENT,
  useTaskKeyboardNavigation,
} from "./useTaskKeyboardNavigation";

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

  it("keeps task shortcuts active from controls inside the selected task row", () => {
    const { getByTestId } = render(<KeyboardNavigationHarness />);

    fireTaskKey("j", 74);
    getByTestId("task-one-control").focus();
    fireEvent.keyDown(getByTestId("task-one-control"), { key: "j", keyCode: 74, which: 74 });

    expect(getByTestId("task-two")).toHaveAttribute("data-selected", "true");
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

  it("handles neutral shortcuts in only one mounted task navigation scope", () => {
    const { getByTestId } = render(
      <>
        <KeyboardNavigationHarness idPrefix="first-" />
        <KeyboardNavigationHarness idPrefix="second-" />
      </>,
    );

    fireTaskKey("j", 74);

    expect(getByTestId("first-task-one")).toHaveAttribute("data-selected", "false");
    expect(getByTestId("second-task-one")).toHaveAttribute("data-selected", "true");
  });

  it("uses the focused task navigation scope even when another scope is mounted", () => {
    const { getByTestId } = render(
      <>
        <KeyboardNavigationHarness idPrefix="first-" />
        <KeyboardNavigationHarness idPrefix="second-" />
      </>,
    );

    getByTestId("first-task-one").focus();
    fireTaskKey("j", 74);

    expect(getByTestId("first-task-one")).toHaveAttribute("data-selected", "true");
    expect(getByTestId("second-task-one")).toHaveAttribute("data-selected", "false");
  });

  it("opens the selected task assignee control with a", () => {
    const { getByTestId } = render(<KeyboardNavigationHarness />);

    fireTaskKey("j", 74);
    fireTaskKey("a", 65);

    expect(getByTestId("task-one-assignee")).toHaveAttribute("data-open-count", "1");
    expect(getByTestId("task-two-assignee")).toHaveAttribute("data-open-count", "0");
  });

  it("opens the selected task status control with s", () => {
    const { getByTestId } = render(<KeyboardNavigationHarness />);

    fireTaskKey("j", 74);
    fireTaskKey("s", 83);

    expect(getByTestId("task-one-status")).toHaveAttribute("data-open-count", "1");
    expect(getByTestId("task-two-status")).toHaveAttribute("data-open-count", "0");
  });

  it("opens the selected task due date control with d", () => {
    const { getByTestId } = render(<KeyboardNavigationHarness />);

    fireTaskKey("j", 74);
    fireTaskKey("d", 68);

    expect(getByTestId("task-one-due-date")).toHaveAttribute("data-open-count", "1");
    expect(getByTestId("task-two-due-date")).toHaveAttribute("data-open-count", "0");
  });

  it("opens the selected task with enter", () => {
    const onOpenSelectedTask = jest.fn();
    const { getByTestId } = render(<KeyboardNavigationHarness onOpenSelectedTask={onOpenSelectedTask} />);

    fireTaskKey("j", 74);
    fireTaskKey("Enter", 13);

    expect(onOpenSelectedTask).toHaveBeenCalledWith("one", getByTestId("task-one"));
  });

  it("does not open a task with enter from an interactive control", () => {
    const onOpenSelectedTask = jest.fn();
    const { getByTestId } = render(<KeyboardNavigationHarness onOpenSelectedTask={onOpenSelectedTask} />);

    fireTaskKey("j", 74);
    getByTestId("task-one-control").focus();
    fireEvent.keyDown(getByTestId("task-one-control"), { key: "Enter", keyCode: 13, which: 13 });

    expect(onOpenSelectedTask).not.toHaveBeenCalled();
  });

  it("does not open a task with enter when no task is selected", () => {
    const onOpenSelectedTask = jest.fn();
    render(<KeyboardNavigationHarness onOpenSelectedTask={onOpenSelectedTask} />);

    fireTaskKey("Enter", 13);

    expect(onOpenSelectedTask).not.toHaveBeenCalled();
  });

  it("can disable the status field shortcut", () => {
    const { getByTestId } = render(<KeyboardNavigationHarness fieldShortcuts={{ status: false }} />);

    fireTaskKey("j", 74);
    fireTaskKey("s", 83);

    expect(getByTestId("task-one-status")).toHaveAttribute("data-open-count", "0");
    expect(getByTestId("task-two-status")).toHaveAttribute("data-open-count", "0");
  });

  it("does not open task field controls when no task is selected", () => {
    const { getByTestId } = render(<KeyboardNavigationHarness />);

    fireTaskKey("a", 65);
    fireTaskKey("s", 83);
    fireTaskKey("d", 68);

    expect(getByTestId("task-one-assignee")).toHaveAttribute("data-open-count", "0");
    expect(getByTestId("task-two-assignee")).toHaveAttribute("data-open-count", "0");
    expect(getByTestId("task-one-status")).toHaveAttribute("data-open-count", "0");
    expect(getByTestId("task-two-status")).toHaveAttribute("data-open-count", "0");
    expect(getByTestId("task-one-due-date")).toHaveAttribute("data-open-count", "0");
    expect(getByTestId("task-two-due-date")).toHaveAttribute("data-open-count", "0");
  });
});

function KeyboardNavigationHarness({
  idPrefix = "",
  fieldShortcuts,
  onOpenSelectedTask,
}: {
  idPrefix?: string;
  fieldShortcuts?: { assignee?: boolean; status?: boolean; dueDate?: boolean };
  onOpenSelectedTask?: (taskId: string, row: HTMLElement) => void;
}) {
  const { containerRef, selectedTaskId, clearSelection, scopeBind } = useTaskKeyboardNavigation<HTMLDivElement>({
    fieldShortcuts,
    onOpenSelectedTask,
  });

  return (
    <>
      <button data-testid={`${idPrefix}outside-button`}>Outside control</button>
      <div ref={containerRef} data-testid={`${idPrefix}task-container`} {...scopeBind}>
        <input data-testid={`${idPrefix}task-input`} />
        <button data-testid={`${idPrefix}clear-selection`} onClick={clearSelection}>
          Clear
        </button>
        {["one", "two"].map((id) => (
          <TaskRow
            key={id}
            id={id}
            testIdPrefix={idPrefix}
            selected={selectedTaskId === id}
          />
        ))}
      </div>
    </>
  );
}

function TaskRow({ id, testIdPrefix, selected }: { id: string; testIdPrefix: string; selected: boolean }) {
  const rowRef = React.useRef<HTMLDivElement>(null);
  const [openCount, setOpenCount] = React.useState(0);
  const [statusOpenCount, setStatusOpenCount] = React.useState(0);
  const [dueDateOpenCount, setDueDateOpenCount] = React.useState(0);

  React.useEffect(() => {
    const element = rowRef.current;
    if (!element) return;

    const handleOpenAssignee = () => setOpenCount((count) => count + 1);
    const handleOpenStatus = () => setStatusOpenCount((count) => count + 1);
    const handleOpenDueDate = () => setDueDateOpenCount((count) => count + 1);
    element.addEventListener(OPEN_TASK_ASSIGNEE_EVENT, handleOpenAssignee);
    element.addEventListener(OPEN_TASK_STATUS_EVENT, handleOpenStatus);
    element.addEventListener(OPEN_TASK_DUE_DATE_EVENT, handleOpenDueDate);

    return () => {
      element.removeEventListener(OPEN_TASK_ASSIGNEE_EVENT, handleOpenAssignee);
      element.removeEventListener(OPEN_TASK_STATUS_EVENT, handleOpenStatus);
      element.removeEventListener(OPEN_TASK_DUE_DATE_EVENT, handleOpenDueDate);
    };
  }, []);

  return (
    <div
      ref={rowRef}
      data-task-row-id={id}
      data-testid={`${testIdPrefix}task-${id}`}
      data-selected={selected ? "true" : "false"}
      tabIndex={-1}
    >
      {id}
      <button data-testid={`${testIdPrefix}task-${id}-control`}>Row control</button>
      <span data-testid={`${testIdPrefix}task-${id}-assignee`} data-open-count={openCount} />
      <span data-testid={`${testIdPrefix}task-${id}-status`} data-open-count={statusOpenCount} />
      <span data-testid={`${testIdPrefix}task-${id}-due-date`} data-open-count={dueDateOpenCount} />
    </div>
  );
}

function fireTaskKey(key: "j" | "k" | "a" | "s" | "d" | "Enter" | "Escape", keyCode: number) {
  fireEvent.keyDown(document, { key, keyCode, which: keyCode });
  fireEvent.keyUp(document, { key, keyCode, which: keyCode });
}
