import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { expect } from "storybook/test";
import type { Person, Task, TaskBoardSummary } from "../ApiTypes";
import { SpaceTaskBoardCard } from "./index";

const meta: Meta<typeof SpaceTaskBoardCard> = { title: "Components/SpaceTaskBoardCard", component: SpaceTaskBoardCard };
type Story = StoryObj<typeof SpaceTaskBoardCard>;

export default meta;

export const Empty: Story = {
  args: {
    board: {
      __typename: "task_board_summary",
      id: "campaigns",
      name: "Campaigns",
      position: 1,
      isDefault: false,
      archivedAt: null,
    },
    tasks: [],
    to: "#campaigns",
  },
};

export const WithTasks: Story = {
  args: { ...Empty.args, tasks: [{ __typename: "task", id: "task", name: "Prepare launch email", type: "space" }] },
};

const assignees: Person[] = Array.from({ length: 5 }, (_, index) => ({
  __typename: "person",
  id: `person-${index}`,
  fullName: `Team Member ${index + 1}`,
  title: "",
  avatarUrl: null,
  email: `member-${index}@example.com`,
  type: "person",
}));

const taskNames = [
  "Review the launch checklist and confirm every owner",
  "Prepare the customer announcement for next week's release",
  "Coordinate the final design review with the product team",
  "Update the onboarding guide for the next group of customers",
  "Check the analytics dashboard and share the latest results",
  "Plan the support handoff for the upcoming release",
  "Resolve the remaining feedback from the accessibility review",
  "This eighth task must not appear in the preview",
];
const assigneeCounts = [0, 1, 3, 5, 1, 3, 5, 0];
const tasks: Task[] = taskNames.map((name, index) => ({
  __typename: "task",
  id: `task-${index + 1}`,
  name,
  type: "space",
  status: {
    __typename: "task_status",
    id: index % 2 === 0 ? "open" : "done",
    label: index % 2 === 0 ? "Open" : "Done",
    color: index % 2 === 0 ? "blue" : "green",
    index: index % 2,
    value: index % 2 === 0 ? "open" : "done",
    closed: index % 2 !== 0,
  },
  assignees: assignees.slice(0, assigneeCounts[index]),
}));

const defaultBoard: TaskBoardSummary = {
  __typename: "task_board_summary",
  id: "default-tasks",
  name: "Tasks",
  position: 0,
  isDefault: true,
  archivedAt: null,
};

function getElement(parent: Element, selector: string): HTMLElement {
  const element = parent.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  return element;
}

async function assertDenseLayout({ canvasElement }: { canvasElement: HTMLElement }) {
  const card = getElement(canvasElement, '[data-test-id="task-board-title"]').closest("a");
  if (!card) throw new Error("Task board card is missing");
  const title = getElement(card, '[data-test-id="task-board-title"]');
  const preview = getElement(card, '[data-test-id="task-board-preview"]');
  const rows = Array.from(preview.querySelectorAll<HTMLElement>('[data-test-id="task-board-row"]'));
  const cardBounds = card.getBoundingClientRect();
  const titleBounds = title.getBoundingClientRect();
  const previewBounds = preview.getBoundingClientRect();

  await expect(cardBounds.height).toBe(380);
  await expect(card.getAttribute("href")).toBe("/tasks");
  await expect(rows).toHaveLength(7);
  await expect(preview.textContent).not.toContain(taskNames[7]);
  await expect(titleBounds.top).toBeGreaterThanOrEqual(cardBounds.top);
  await expect(titleBounds.bottom).toBeLessThanOrEqual(previewBounds.top);
  await expect(title.scrollHeight).toBeLessThanOrEqual(title.clientHeight);
  await expect(previewBounds.bottom).toBeLessThanOrEqual(cardBounds.bottom);

  const singleAssigneeRowHeight = rows[1]?.getBoundingClientRect().height;
  if (!singleAssigneeRowHeight) throw new Error("Single-assignee task row is missing");
  for (const row of rows) {
    const rowBounds = row.getBoundingClientRect();
    const nameBounds = getElement(row, '[data-test-id="task-board-task-name"]').getBoundingClientRect();
    const assigneeList = getElement(row, '[data-test-id="task-board-assignees"]').firstElementChild;
    if (!assigneeList) throw new Error("Assignee list is missing");
    const assigneeBounds = assigneeList.getBoundingClientRect();
    const avatars = Array.from(assigneeList.children);

    await expect(rowBounds.top).toBeGreaterThanOrEqual(previewBounds.top);
    await expect(rowBounds.bottom).toBeLessThanOrEqual(previewBounds.bottom);
    if (avatars.length > 0) {
      await expect(Math.abs(rowBounds.height - singleAssigneeRowHeight)).toBeLessThanOrEqual(1);
    }
    await expect(nameBounds.right).toBeLessThanOrEqual(assigneeBounds.left);
    await expect(assigneeBounds.right).toBeLessThanOrEqual(rowBounds.right);
    await expect(row.querySelector("svg")).not.toBeNull();
    const firstAvatarBounds = avatars[0]?.getBoundingClientRect();
    for (const avatar of avatars) {
      const bounds = avatar.getBoundingClientRect();
      await expect(bounds.top).toBeGreaterThanOrEqual(rowBounds.top);
      await expect(bounds.bottom).toBeLessThanOrEqual(rowBounds.bottom);
      if (firstAvatarBounds) {
        await expect(
          Math.abs(bounds.top + bounds.height / 2 - firstAvatarBounds.top - firstAvatarBounds.height / 2),
        ).toBeLessThanOrEqual(1);
      }
    }
  }

  const crowdedRow = rows[3];
  if (!crowdedRow) throw new Error("Crowded task row is missing");
  const longName = getElement(crowdedRow, '[data-test-id="task-board-task-name"]');
  await expect(longName.scrollWidth).toBeGreaterThan(longName.clientWidth);
  const crowdedAssignees = getElement(crowdedRow, '[data-test-id="task-board-assignees"]');
  await expect(crowdedAssignees.firstElementChild?.children).toHaveLength(4);
  await expect(crowdedAssignees.textContent).toContain("+2");
}

export const DenseDefaultBoard: Story = {
  args: { board: defaultBoard, tasks, to: "/tasks" },
  decorators: [
    (Story) => (
      <div style={{ display: "grid", width: 340 }}>
        <Story />
      </div>
    ),
  ],
  play: assertDenseLayout,
};

export const DenseCustomBoardNarrow: Story = {
  args: {
    board: { ...defaultBoard, id: "custom-tasks", name: "Delivery Tasks", isDefault: false },
    tasks,
    to: "/tasks",
  },
  decorators: [
    (Story) => (
      <div style={{ display: "grid", width: 280 }}>
        <Story />
      </div>
    ),
  ],
  play: assertDenseLayout,
};
