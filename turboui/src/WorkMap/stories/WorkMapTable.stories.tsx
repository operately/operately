import type { Meta, StoryObj } from "@storybook/react-vite";
import { WorkMapTable } from "../components/WorkMapTable";
import * as Steps from "../tests/steps";
import { mockItems, onlyGoals, onlyProjects, onlyCompleted } from "../tests/mockData";

const meta = {
  title: "Components/WorkMap/WorkMapTable",
  component: WorkMapTable,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    tab: {
      description: "Current tab applied to the WorkMapTable",
      options: [undefined, "all", "goals", "projects", "completed"],
      control: { type: "select" },
    },
    items: {
      description: "WorkMap items to display",
      control: "object",
    },
  },
} satisfies Meta<typeof WorkMapTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: mockItems,
    tab: "all",
  },
};

export const GoalsOnly: Story = {
  args: {
    items: onlyGoals,
    tab: "goals",
  },
};

export const ProjectsOnly: Story = {
  args: {
    items: onlyProjects,
    tab: "projects",
  },
};

export const CompletedOnly: Story = {
  args: {
    items: onlyCompleted,
    tab: "completed",
  },
};

// Test story for collapsing a goal's children
export const CollapseGoal: Story = {
  args: {
    items: mockItems,
    tab: "all",
  },
  play: async ({ canvasElement, step }) => {
    const parentGoal = "Reduce onboarding time by 30%";
    const children = [
      "Automate user account setup",
      "Implement secure authentication service",
      "Implement self-guided tutorial",
    ];

    await Steps.assertItemVisible(canvasElement, step, parentGoal);
    await Steps.assertChildrenVisible(canvasElement, step, children);

    await Steps.toggleItem(canvasElement, step, parentGoal);

    await Steps.assertChildrenHidden(canvasElement, step, children);
  },
};

// Test story for toggling a goal
export const ToggleGoal: Story = {
  args: {
    items: mockItems,
    tab: "all",
  },
  play: async ({ canvasElement, step }) => {
    const parentGoal = "Acquire the first users of Operately outside Semaphore";
    const children = [
      "Document features in Help Center",
      "Release 0.4",
      "Increase user engagement by 50%",
      "Create onboarding email sequence",
    ];

    await Steps.assertItemVisible(canvasElement, step, parentGoal);

    await Steps.assertChildrenVisible(canvasElement, step, children);

    await Steps.toggleItem(canvasElement, step, parentGoal);

    await Steps.assertChildrenHidden(canvasElement, step, children);

    await Steps.toggleItem(canvasElement, step, parentGoal);

    await Steps.assertChildrenVisible(canvasElement, step, children);
  },
};

export const Indentation: Story = {
  args: {
    items: mockItems,
    tab: "all",
  },
  play: async ({ canvasElement, step }) => {
    await Steps.assertIndentation(canvasElement, step, "Improve customer onboarding experience", 0, "0px");

    await Steps.assertIndentation(canvasElement, step, "Reduce onboarding time by 30%", 1, "20px");
    await Steps.assertIndentation(canvasElement, step, "Release 0.4", 1, "20px");

    await Steps.assertIndentation(canvasElement, step, "Automate user account setup", 2, "40px");
    await Steps.assertIndentation(canvasElement, step, "GDPR compliance implementation", 2, "40px");

    await Steps.assertIndentation(canvasElement, step, "Implement secure authentication service", 3, "60px");
  },
};
