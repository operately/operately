import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { Kanban } from "./Kanban";
import type { StatusSelector } from "../../StatusSelector";
import { TaskDisplayMenu } from "../components/TaskDisplayMenu";

jest.mock("@atlaskit/pragmatic-drag-and-drop/element/adapter", () => ({
  dropTargetForElements: () => () => {},
}));

jest.mock("../../utils/PragmaticDragAndDrop", () => ({
  DropIndicator: () => null,
  useHorizontalAutoScroll: () => ({ current: null }),
  useSortableItem: () => ({
    ref: { current: null },
    dragHandleRef: { current: null },
    isDragging: false,
    closestEdge: null,
  }),
  projectItemsWithPlaceholder: ({ items }: { items: unknown[] }) => ({
    items,
    placeholderIndex: null,
  }),
}));

jest.mock("../hooks/useTaskKeyboardNavigation", () => ({
  useTaskKeyboardNavigation: () => ({
    containerRef: { current: null },
    selectedTaskId: null,
    scopeBind: {},
  }),
}));

const pendingStatus: StatusSelector.StatusOption = {
  id: "pending",
  value: "pending",
  label: "Not started",
  color: "gray",
  icon: "circleDashed",
  index: 0,
};

const doneStatus: StatusSelector.StatusOption = {
  id: "done",
  value: "done",
  label: "Done",
  color: "green",
  icon: "circleCheck",
  index: 1,
  closed: true,
};

const canceledStatus: StatusSelector.StatusOption = {
  id: "canceled",
  value: "canceled",
  label: "Canceled",
  color: "red",
  icon: "circleX",
  index: 2,
  closed: true,
};

describe("Kanban", () => {
  it("controls ordinary closed-status columns from Display without adding a board-track disclosure", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Kanban
        milestone={null}
        columns={{ pending: [], done: [], canceled: [] }}
        draggedItemId={null}
        targetLocation={null}
        placeholderHeight={null}
        statuses={[pendingStatus, doneStatus, canceledStatus]}
        onAddStatusClick={jest.fn()}
        onTaskClick={jest.fn()}
        isTaskSlideInOpen={false}
        canEdit={true}
        canManageStatuses={true}
        toolbarLeading={<span>Viewing tasks</span>}
        toolbarActions={({ closedStatuses }) => (
          <TaskDisplayMenu mode="board" onChange={jest.fn()} closedStatuses={closedStatuses} />
        )}
      />,
    );

    const columns = getTestElement(container, "kanban-columns");
    const toolbar = getTestElement(container, "kanban-toolbar");
    const addStatusButton = screen.getByRole("button", { name: "Add status" });

    expect(getKanbanColumn(container, "pending")).toBeInTheDocument();
    expect(container.querySelector('[data-test-id="kanban-column-done"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-test-id="kanban-column-canceled"]')).not.toBeInTheDocument();
    expect(toolbar).toHaveTextContent("Viewing tasks");
    expect(toolbar).toContainElement(screen.getByRole("button", { name: "Display options" }));
    expect(columns).toContainElement(addStatusButton);
    expect(toolbar).not.toContainElement(addStatusButton);
    expect(toolbar).toAppearBefore(columns);
    expect(within(columns).queryByText("Closed statuses")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /closed statuses/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Display options" }));

    const closedStatusesSwitch = screen.getByRole("switch", { name: "Show closed statuses" });
    const displayMenu = getTestElement(document.body, "display-menu");

    expect(closedStatusesSwitch).not.toBeChecked();
    expect(within(displayMenu).getByText("2")).toBeInTheDocument();

    await user.click(closedStatusesSwitch);

    expect(closedStatusesSwitch).toBeChecked();
    expect(columns).toContainElement(getKanbanColumn(container, "done"));
    expect(columns).toContainElement(getKanbanColumn(container, "canceled"));
    expect(within(columns).queryByText("Closed statuses")).not.toBeInTheDocument();
  });

  it("shows a task count in each visible column header", () => {
    const { container } = render(
      <Kanban
        milestone={null}
        columns={{ pending: [], done: [] }}
        draggedItemId={null}
        targetLocation={null}
        placeholderHeight={null}
        statuses={[pendingStatus, doneStatus]}
        onTaskClick={jest.fn()}
        isTaskSlideInOpen={false}
        canEdit={false}
      />,
    );

    expect(container.querySelector('[data-test-id="kanban-column-task-count-pending"]')).toHaveTextContent("0");
  });
});

function getKanbanColumn(container: HTMLElement, status: string): HTMLElement {
  return getTestElement(container, `kanban-column-${status}`);
}

function getTestElement(container: HTMLElement, testId: string): HTMLElement {
  const element = container.querySelector<HTMLElement>(`[data-test-id="${testId}"]`);

  if (!element) throw new Error(`Expected ${testId} to be present`);

  return element;
}
