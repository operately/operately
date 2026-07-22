import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { Kanban } from "./Kanban";
import type { StatusSelector } from "../../StatusSelector";

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

describe("Kanban", () => {
  it("keeps empty closed statuses out of the working board until requested", () => {
    const onTaskCreate = jest.fn();
    const { container } = render(
      <Kanban
        milestone={null}
        columns={{ pending: [], done: [] }}
        draggedItemId={null}
        targetLocation={null}
        placeholderHeight={null}
        statuses={[pendingStatus, doneStatus]}
        onTaskCreate={onTaskCreate}
        onTaskClick={jest.fn()}
        isTaskSlideInOpen={false}
        canEdit={true}
      />,
    );

    expect(container.querySelector('[data-test-id="kanban-column-pending"]')).toBeInTheDocument();
    expect(container.querySelector('[data-test-id="kanban-column-done"]')).not.toBeInTheDocument();
    const closedStatusesToggle = container.querySelector('[data-test-id="toggle-closed-statuses"]');

    expect(closedStatusesToggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Add task" })).toBeInTheDocument();
    expect(screen.queryByText("No tasks here yet")).not.toBeInTheDocument();
    expect(container.querySelector('[data-test-id="kanban-task-count"]')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add task" }));

    expect(screen.getByPlaceholderText("What needs to be done?")).toBeInTheDocument();

    fireEvent.click(closedStatusesToggle!);

    expect(container.querySelector('[data-test-id="kanban-column-done"]')).toBeInTheDocument();
    expect(closedStatusesToggle).toHaveAttribute("aria-expanded", "true");
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
