import React from "react";
import { fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom";

import {
  OPEN_TASK_ASSIGNEE_EVENT,
  OPEN_TASK_CREATE_EVENT,
  OPEN_TASK_DUE_DATE_EVENT,
  OPEN_TASK_EVENT,
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

  it("can keep the selected task when escape clearing is disabled", () => {
    const { getByTestId, rerender } = render(<KeyboardNavigationHarness />);

    fireTaskKey("j", 74);
    expect(getByTestId("task-one")).toHaveAttribute("data-selected", "true");

    rerender(<KeyboardNavigationHarness clearSelectionWithEscape={false} />);
    fireTaskKey("Escape", 27);

    expect(getByTestId("task-one")).toHaveAttribute("data-selected", "true");
  });

  it("keeps the selected task when the task slide-in is mounted", () => {
    const { getByTestId } = render(<KeyboardNavigationHarness />);
    const slideIn = document.createElement("div");
    slideIn.setAttribute("data-test-id", "task-slide-in");
    document.body.appendChild(slideIn);

    try {
      fireTaskKey("j", 74);
      expect(getByTestId("task-one")).toHaveAttribute("data-selected", "true");

      fireTaskKey("Escape", 27);

      expect(getByTestId("task-one")).toHaveAttribute("data-selected", "true");
    } finally {
      slideIn.remove();
    }
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

  it("opens the selected task with enter", () => {
    const { getByTestId } = render(<KeyboardNavigationHarness />);

    fireTaskKey("j", 74);
    fireTaskKey("Enter", 13);

    expect(getByTestId("task-one-open")).toHaveAttribute("data-open-count", "1");
    expect(getByTestId("task-two-open")).toHaveAttribute("data-open-count", "0");
  });

  it("lets interactive task controls handle enter themselves", () => {
    const { getByTestId } = render(<KeyboardNavigationHarness />);

    fireTaskKey("j", 74);
    fireEvent.keyDown(getByTestId("task-one-control"), { key: "Enter", keyCode: 13, which: 13 });

    expect(getByTestId("task-one-open")).toHaveAttribute("data-open-count", "0");
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

  it("can disable the status field shortcut", () => {
    const { getByTestId } = render(<KeyboardNavigationHarness fieldShortcuts={{ status: false }} />);

    fireTaskKey("j", 74);
    fireTaskKey("s", 83);

    expect(getByTestId("task-one-status")).toHaveAttribute("data-open-count", "0");
    expect(getByTestId("task-two-status")).toHaveAttribute("data-open-count", "0");
  });

  it("can enable the selected task create shortcut with c", () => {
    const { getByTestId } = render(<KeyboardNavigationHarness fieldShortcuts={{ create: true }} />);

    fireTaskKey("j", 74);
    fireTaskKey("c", 67);

    expect(getByTestId("task-one-create")).toHaveAttribute("data-open-count", "1");
    expect(getByTestId("task-two-create")).toHaveAttribute("data-open-count", "0");
  });

  it("does not open the selected task create shortcut by default", () => {
    const { getByTestId } = render(<KeyboardNavigationHarness />);

    fireTaskKey("j", 74);
    fireTaskKey("c", 67);

    expect(getByTestId("task-one-create")).toHaveAttribute("data-open-count", "0");
    expect(getByTestId("task-two-create")).toHaveAttribute("data-open-count", "0");
  });

  it("does not open task field controls when no task is selected", () => {
    const { getByTestId } = render(<KeyboardNavigationHarness />);

    fireTaskKey("a", 65);
    fireTaskKey("s", 83);
    fireTaskKey("d", 68);
    fireTaskKey("c", 67);
    fireTaskKey("Enter", 13);

    expect(getByTestId("task-one-assignee")).toHaveAttribute("data-open-count", "0");
    expect(getByTestId("task-two-assignee")).toHaveAttribute("data-open-count", "0");
    expect(getByTestId("task-one-status")).toHaveAttribute("data-open-count", "0");
    expect(getByTestId("task-two-status")).toHaveAttribute("data-open-count", "0");
    expect(getByTestId("task-one-due-date")).toHaveAttribute("data-open-count", "0");
    expect(getByTestId("task-two-due-date")).toHaveAttribute("data-open-count", "0");
    expect(getByTestId("task-one-create")).toHaveAttribute("data-open-count", "0");
    expect(getByTestId("task-two-create")).toHaveAttribute("data-open-count", "0");
    expect(getByTestId("task-one-open")).toHaveAttribute("data-open-count", "0");
    expect(getByTestId("task-two-open")).toHaveAttribute("data-open-count", "0");
  });
});

function KeyboardNavigationHarness({
  idPrefix = "",
  fieldShortcuts,
  clearSelectionWithEscape,
}: {
  idPrefix?: string;
  fieldShortcuts?: { assignee?: boolean; status?: boolean; dueDate?: boolean; create?: boolean };
  clearSelectionWithEscape?: boolean;
}) {
  const { containerRef, selectedTaskId, clearSelection, scopeBind } = useTaskKeyboardNavigation<HTMLDivElement>({
    fieldShortcuts,
    clearSelectionWithEscape,
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
  const [createOpenCount, setCreateOpenCount] = React.useState(0);
  const [openTaskCount, setOpenTaskCount] = React.useState(0);

  React.useEffect(() => {
    const element = rowRef.current;
    if (!element) return;

    const handleOpenAssignee = () => setOpenCount((count) => count + 1);
    const handleOpenStatus = () => setStatusOpenCount((count) => count + 1);
    const handleOpenDueDate = () => setDueDateOpenCount((count) => count + 1);
    const handleOpenCreate = () => setCreateOpenCount((count) => count + 1);
    const handleOpenTask = () => setOpenTaskCount((count) => count + 1);
    element.addEventListener(OPEN_TASK_ASSIGNEE_EVENT, handleOpenAssignee);
    element.addEventListener(OPEN_TASK_STATUS_EVENT, handleOpenStatus);
    element.addEventListener(OPEN_TASK_DUE_DATE_EVENT, handleOpenDueDate);
    element.addEventListener(OPEN_TASK_CREATE_EVENT, handleOpenCreate);
    element.addEventListener(OPEN_TASK_EVENT, handleOpenTask);

    return () => {
      element.removeEventListener(OPEN_TASK_ASSIGNEE_EVENT, handleOpenAssignee);
      element.removeEventListener(OPEN_TASK_STATUS_EVENT, handleOpenStatus);
      element.removeEventListener(OPEN_TASK_DUE_DATE_EVENT, handleOpenDueDate);
      element.removeEventListener(OPEN_TASK_CREATE_EVENT, handleOpenCreate);
      element.removeEventListener(OPEN_TASK_EVENT, handleOpenTask);
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
      <span data-testid={`${testIdPrefix}task-${id}-create`} data-open-count={createOpenCount} />
      <span data-testid={`${testIdPrefix}task-${id}-open`} data-open-count={openTaskCount} />
    </div>
  );
}

function fireTaskKey(key: "j" | "k" | "a" | "s" | "d" | "c" | "Enter" | "Escape", keyCode: number) {
  fireEvent.keyDown(document, { key, keyCode, which: keyCode });
  fireEvent.keyUp(document, { key, keyCode, which: keyCode });
}
