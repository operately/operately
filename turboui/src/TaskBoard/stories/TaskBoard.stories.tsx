import type { Meta, StoryObj } from "@storybook/react";
import { TaskBoard } from "../components";
import { Page } from "../../Page";
import { mockTasks, mockEmptyTasks } from "../tests/mockData";

/**
 * TaskBoard is a comprehensive task management component designed for teams.
 */
const meta = {
  title: "Components/TaskBoard",
  component: TaskBoard,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    tasks: { control: "object" },
    viewMode: { control: "select", options: ["table", "kanban", "timeline"] },
  },
  decorators: [
    (Story, context) => (
      <div className="h-[800px] py-[4.5rem] px-2">
        <Page title={context.args.title} size="fullwidth">
          <Story />
        </Page>
      </div>
    ),
  ],
} satisfies Meta<typeof TaskBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default table view of the TaskBoard with multiple tasks in different statuses
 */
export const Default: Story = {
  tags: ["autodocs"],
  args: {
    title: "Task Board",
    tasks: mockTasks,
    viewMode: "table",
  },
};

/**
 * Empty TaskBoard with no tasks
 */
export const EmptyState: Story = {
  tags: ["autodocs"],
  args: {
    title: "Project Tasks",
    tasks: mockEmptyTasks,
    viewMode: "table",
  },
};

/**
 * Kanban view of the TaskBoard
 */
export const KanbanView: Story = {
  tags: ["autodocs"],
  render: (args) => (
    <div className="h-[800px] py-4">
      <Page title={args.title} size="fullwidth">
        <TaskBoard {...args} />
      </Page>
    </div>
  ),
  args: {
    title: "Project Tasks",
    tasks: mockTasks,
    viewMode: "kanban",
  },
};

/**
 * Timeline view of the TaskBoard
 */
export const TimelineView: Story = {
  tags: ["autodocs"],
  render: (args) => (
    <div className="h-[800px] py-4">
      <Page title={args.title} size="fullwidth">
        <TaskBoard {...args} />
      </Page>
    </div>
  ),
  args: {
    title: "Project Tasks",
    tasks: mockTasks,
    viewMode: "timeline",
  },
};
