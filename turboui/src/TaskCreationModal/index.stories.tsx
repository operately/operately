import type { Meta, StoryObj } from "@storybook/react-vite";
import React, { useState } from "react";
import { expect, within } from "storybook/test";
import { TaskCreationModal } from ".";
import { PrimaryButton } from "../Button";
import { createContextualDate } from "../DateField/mockData";
import type { NewTaskPayload, Milestone } from "../TaskBoard/types";
import type { TemplateProjectPage } from "../TemplateProjectPage";
import { usePersonFieldSearch } from "../utils/storybook/usePersonFieldSearch";
import { defaultFormattedTimePreferences } from "../utils/storybook/formattedTime";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";

const sampleMilestones: Milestone[] = [
  {
    id: "milestone-1",
    name: "Sprint 1",
    dueDate: createContextualDate("2025-06-20", "day"),
    status: "pending",
    link: "#",
    kanbanLink: "#",
  },
  {
    id: "milestone-2",
    name: "Sprint 2",
    dueDate: createContextualDate("2025-07-03", "day"),
    status: "pending",
    link: "#",
    kanbanLink: "#",
  },
  {
    id: "milestone-3",
    name: "Product Launch",
    dueDate: createContextualDate("2025-07-15", "day"),
    status: "pending",
    link: "#",
    kanbanLink: "#",
  },
];

const samplePeople = [
  { id: "person-1", fullName: "Jane Smith", avatarUrl: "https://i.pravatar.cc/150?img=1" },
  { id: "person-2", fullName: "John Doe", avatarUrl: "https://i.pravatar.cc/150?img=2" },
  { id: "person-3", fullName: "Alex Johnson", avatarUrl: "https://i.pravatar.cc/150?img=3" },
];

const templateMilestones = [
  { id: "milestone-1", title: "Kickoff" },
  { id: "milestone-2", title: "Launch" },
];

const templateStatuses = [
  { id: "todo", value: "todo", label: "To do", color: "gray" as const, icon: "circleDashed" as const, index: 0 },
  {
    id: "progress",
    value: "progress",
    label: "In progress",
    color: "blue" as const,
    icon: "circleDot" as const,
    index: 1,
  },
  {
    id: "done",
    value: "done",
    label: "Done",
    color: "green" as const,
    icon: "circleCheck" as const,
    index: 2,
    closed: true,
  },
];

const meta: Meta<typeof TaskCreationModal> = {
  title: "Components/TaskCreationModal",
  component: TaskCreationModal,
  tags: ["!autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof TaskCreationModal>;

export const Project: Story = {
  render: () => {
    const assigneePersonSearch = usePersonFieldSearch(samplePeople);
    const [isOpen, setIsOpen] = useState(false);
    const [taskCount, setTaskCount] = useState(0);
    const [lastTaskTitle, setLastTaskTitle] = useState("");

    const handleCreateTask = (task: NewTaskPayload) => {
      setTaskCount((count) => count + 1);
      setLastTaskTitle(task.title);
    };

    return (
      <div className="p-6 flex flex-col gap-4 max-w-lg">
        <div>
          <h3 className="text-lg font-semibold">Project task creation</h3>
          <p className="text-content-subtle mt-1 mb-4">Click the button below to open the task creation modal</p>

          <PrimaryButton onClick={() => setIsOpen(true)}>+ Add Task</PrimaryButton>
        </div>

        {taskCount > 0 && (
          <div className="mt-2 p-4 bg-surface-accent rounded-md">
            <p className="text-sm font-medium">Tasks created: {taskCount}</p>
            {lastTaskTitle && <p className="text-sm text-content-subtle mt-1">Last task: "{lastTaskTitle}"</p>}
          </div>
        )}

        <TaskCreationModal
          variant="project"
          assigneePersonSearch={assigneePersonSearch}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          milestones={sampleMilestones}
          onMilestoneSearch={async () => {}}
          onCreateTask={handleCreateTask}
          formattedTimePreferences={defaultFormattedTimePreferences}
        />
      </div>
    );
  },
};

export const ProjectTemplate: Story = {
  render: (args) => {
    const personSearch = usePersonFieldSearch(samplePeople);
    const [isOpen, setIsOpen] = useState(args.isOpen ?? false);
    const [taskCount, setTaskCount] = useState(0);
    const [lastTaskTitle, setLastTaskTitle] = useState("");

    const handleCreateTask = (task: Omit<TemplateProjectPage.Task, "id">) => {
      setTaskCount((count) => count + 1);
      setLastTaskTitle(task.name);
    };

    return (
      <div className="p-6 flex flex-col gap-4 max-w-lg">
        <div>
          <h3 className="text-lg font-semibold">Project template task creation</h3>
          <p className="text-content-subtle mt-1 mb-4">
            Click the button below to open the template task creation modal
          </p>

          <PrimaryButton onClick={() => setIsOpen(true)}>+ Add Task</PrimaryButton>
        </div>

        {taskCount > 0 && (
          <div className="mt-2 p-4 bg-surface-accent rounded-md">
            <p className="text-sm font-medium">Tasks created: {taskCount}</p>
            {lastTaskTitle && <p className="text-sm text-content-subtle mt-1">Last task: "{lastTaskTitle}"</p>}
          </div>
        )}

        <TaskCreationModal
          variant="project-template"
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onCreateTask={handleCreateTask}
          milestones={templateMilestones}
          statuses={templateStatuses}
          personSearch={personSearch}
          richTextHandlers={createMockRichEditorHandlers()}
        />
      </div>
    );
  },
};

export const ProjectTemplateFocused: Story = {
  ...ProjectTemplate,
  args: { isOpen: true },
  globals: {
    viewport: { value: "mobile1", isRotated: false },
  },
  play: async ({ canvasElement }) => {
    const view = canvasElement.ownerDocument.defaultView;
    expect(view?.innerWidth).toBeLessThanOrEqual(360);

    const page = within(canvasElement.ownerDocument.body);
    const dialog = await page.findByRole("dialog", { name: "Create Task" });
    const panel = dialog.firstElementChild;
    if (!(panel instanceof HTMLElement)) throw new Error("Task creation dialog is missing its panel");

    const titleInput = dialog.querySelector<HTMLInputElement>('[data-test-id="template-task-title-input"]');
    const titleField = dialog.querySelector<HTMLElement>('[data-test-id="template-task-title"]');
    if (!titleInput || !titleField) throw new Error("Template task title field is missing");

    titleInput.focus();
    expect(titleInput.ownerDocument.activeElement).toBe(titleInput);
    assertOutlineIsVisible(titleField);

    const footer = dialog.querySelector<HTMLElement>('[data-test-id="create-more-footer"]');
    if (!footer) throw new Error("Template task footer is missing");
    expect(footer.scrollWidth).toBeLessThanOrEqual(footer.clientWidth + 1);

    for (const control of [
      within(dialog).getByRole("switch", { name: "Create more" }),
      within(dialog).getByRole("button", { name: "Cancel" }),
      within(dialog).getByRole("button", { name: "Create task" }),
    ]) {
      assertInside(control, panel);
    }
  },
};

function assertOutlineIsVisible(element: HTMLElement) {
  const style = getComputedStyle(element);
  const outlineWidth = cssPx(style.outlineWidth);
  const outlineOffset = cssPx(style.outlineOffset);
  expect(style.outlineStyle).not.toBe("none");
  expect(outlineWidth).toBeGreaterThan(0);

  const rect = element.getBoundingClientRect();
  const inset = outlineWidth + outlineOffset;
  const bounds = clippingBounds(element);
  expect(rect.left - inset).toBeGreaterThanOrEqual(bounds.left - 1);
  expect(rect.right + inset).toBeLessThanOrEqual(bounds.right + 1);
  expect(rect.top - inset).toBeGreaterThanOrEqual(bounds.top - 1);
  expect(rect.bottom + inset).toBeLessThanOrEqual(bounds.bottom + 1);
}

function assertInside(element: HTMLElement, container: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const bounds = container.getBoundingClientRect();
  expect(rect.width).toBeGreaterThan(0);
  expect(rect.left).toBeGreaterThanOrEqual(bounds.left - 1);
  expect(rect.right).toBeLessThanOrEqual(bounds.right + 1);
}

function clippingBounds(element: Element) {
  let left = Number.NEGATIVE_INFINITY;
  let right = Number.POSITIVE_INFINITY;
  let top = Number.NEGATIVE_INFINITY;
  let bottom = Number.POSITIVE_INFINITY;
  let current = element.parentElement;

  while (current) {
    const style = getComputedStyle(current);
    const rect = current.getBoundingClientRect();
    if (clips(style.overflowX)) {
      left = Math.max(left, rect.left + current.clientLeft);
      right = Math.min(right, rect.left + current.clientLeft + current.clientWidth);
    }
    if (clips(style.overflowY)) {
      top = Math.max(top, rect.top + current.clientTop);
      bottom = Math.min(bottom, rect.top + current.clientTop + current.clientHeight);
    }
    current = current.parentElement;
  }

  return { left, right, top, bottom };
}

function clips(overflow: string) {
  return overflow === "hidden" || overflow === "clip" || overflow === "auto" || overflow === "scroll";
}

function cssPx(value: string) {
  if (value === "thin") return 1;
  if (value === "medium") return 3;
  if (value === "thick") return 5;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
