import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";
import { TaskSlideIn } from "./TaskSlideIn";
import { createMockRichEditorHandlers } from "../../utils/storybook/richEditor";
import { defaultFormattedTimePreferences } from "../../utils/storybook/formattedTime";
import { sampleTemplateMilestones, templateStatuses } from "../../MilestonePage/templateMockData";
import type { TaskPage } from "../../TaskPage";

function getByTestId(testId: string) {
  const el = document.querySelector<HTMLElement>(`[data-test-id="${testId}"]`);
  if (!el) throw new Error(`Could not find element with data-test-id="${testId}"`);
  return el;
}

function queryByTestId(testId: string) {
  return document.querySelector<HTMLElement>(`[data-test-id="${testId}"]`);
}

function renderSlideIn(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

const baseProps: TaskPage.ContentProps = {
  variant: "project-task",
  name: "Project task",
  onNameChange: async () => true,
  description: null,
  onDescriptionChange: async () => true,
  status: templateStatuses[0]!,
  onStatusChange: () => undefined,
  statusOptions: templateStatuses,
  dueDate: undefined,
  onDueDateChange: () => undefined,
  reminders: [],
  onRemindersChange: async () => true,
  milestone: null,
  onMilestoneChange: () => undefined,
  milestones: [],
  onMilestoneSearch: async () => undefined,
  assignees: [],
  onAssigneesChange: () => undefined,
  createdAt: new Date(),
  createdBy: null,
  subscriptions: {
    isSubscribed: false,
    onToggle: () => undefined,
    hidden: false,
    entityType: "project_task",
    subscribedPeople: [],
  },
  onDelete: async () => undefined,
  assigneePersonSearch: { people: [], onSearch: async () => undefined },
  richTextHandlers: createMockRichEditorHandlers(),
  canEdit: true,
  onAddComment: () => undefined,
  onEditComment: () => undefined,
  onDeleteComment: () => undefined,
  formattedTimePreferences: defaultFormattedTimePreferences,
};

describe("TaskSlideIn", () => {
  it("renders project task content when taskPageProps are provided", () => {
    renderSlideIn(<TaskSlideIn isOpen onClose={() => undefined} taskPageProps={baseProps} />);

    expect(getByTestId("task-header")).toBeInTheDocument();
    expect(getByTestId("task-name")).toHaveTextContent("Project task");
    expect(getByTestId("task-due-date")).toBeInTheDocument();
    expect(getByTestId("task-milestone")).toBeInTheDocument();
  });

  it("hides the milestone field for space tasks", () => {
    renderSlideIn(
      <TaskSlideIn
        isOpen
        onClose={() => undefined}
        taskPageProps={{
          ...baseProps,
          variant: "space-task",
          name: "Space task",
        }}
      />,
    );

    expect(getByTestId("task-header")).toBeInTheDocument();
    expect(getByTestId("task-due-date")).toBeInTheDocument();
    expect(queryByTestId("task-milestone")).toBeNull();
  });

  it("renders template task content with relative due date and no timeline", () => {
    renderSlideIn(
      <TaskSlideIn
        isOpen
        onClose={() => undefined}
        taskPageProps={{
          ...baseProps,
          name: "Template task",
          variant: "template",
          dueOffsetDays: 3,
          onDueOffsetDaysChange: () => undefined,
          milestones: sampleTemplateMilestones.map((milestone) => ({
            id: milestone.id,
            name: milestone.title,
            dueDate: null,
            status: "pending",
          })),
        }}
      />,
    );

    expect(getByTestId("task-header")).toBeInTheDocument();
    expect(getByTestId("task-name")).toHaveTextContent("Template task");
    expect(getByTestId("task-due-offset")).toBeInTheDocument();
    expect(queryByTestId("task-due-date")).toBeNull();
    expect(queryByTestId("task-activity-section")).toBeNull();
  });
});
