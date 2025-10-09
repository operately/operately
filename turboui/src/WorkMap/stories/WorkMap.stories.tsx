import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Page } from "../../Page";
import WorkMap from "../components";
import { closedParentWithOngoingChildren, mockItems, mockSingleItem } from "../tests/mockData";
import * as Steps from "../tests/steps";

/**
 * WorkMap is a comprehensive component for displaying and interacting with
 * hierarchical work items like goals and projects.
 */
const meta = {
  title: "Components/WorkMap",
  component: WorkMap,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    items: { control: "object" },
  },
} satisfies Meta<typeof WorkMap>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockSpaces = [
  { id: "space1", name: "Space 1", link: "/spaces/space1" },
  { id: "space2", name: "Space 2", link: "/spaces/space2" },
];

const mockSpaceSearch = async ({ query }: { query: string }) => {
  return mockSpaces.filter((space) => space.name.toLowerCase().includes(query));
};

const mockAddItem: WorkMap.AddNewItemFn = async (props) => {
  console.log("Saving new item:", props);

  return new Promise<{ id: string }>((resolve) => {
    setTimeout(() => {
      resolve({ id: "new-item-id" });
    }, 1000);
  });
};

/**
 * Default view of the WorkMap with multiple items and children
 */
export const Default: Story = {
  tags: ["autodocs"],
  render: (args) => (
    <div className="py-[4.5rem] px-2">
      <Page title={args.title} size="fullwidth">
        <WorkMap {...args} />
      </Page>
    </div>
  ),
  args: {
    title: "Company Work Map",
    items: mockItems,
    addingEnabled: true,
    spaceSearch: mockSpaceSearch,
    addItem: mockAddItem,
    addItemDefaultSpace: mockSpaces[0]!,
  },
  play: async ({ canvasElement, step }) => {
    await Steps.assertRowsNumber(canvasElement, step, 15);
  },
};

/**
 * WorkMap with a single item (no children)
 */
export const SingleItem: Story = {
  tags: ["autodocs"],
  render: (args) => (
    <div className="py-4">
      <Page title={args.title} size="fullwidth">
        <WorkMap {...args} />
      </Page>
    </div>
  ),
  args: {
    title: "Company Work Map",
    items: [mockSingleItem],
  },
  play: async ({ canvasElement, step }) => {
    await Steps.assertRowsNumber(canvasElement, step, 1);

    await Steps.assertItemName(canvasElement, step, "Single standalone goal with no children");
  },
};

/**
 * WorkMap with no items (empty state)
 */
export const Empty: Story = {
  tags: ["autodocs"],
  render: (args) => (
    <div className="py-4">
      <Page title={args.title} size="fullwidth">
        <WorkMap {...args} />
      </Page>
    </div>
  ),
  args: {
    title: "Company Work Map",
    items: [],
    addingEnabled: true,
    spaceSearch: mockSpaceSearch,
    addItem: mockAddItem,
    addItemDefaultSpace: mockSpaces[0]!,
  },
  play: async ({ canvasElement, step }) => {
    await Steps.assertRowsNumber(canvasElement, step, 1);

    await Steps.assertZeroState(canvasElement, step);
  },
};

/**
 * Goals tab selected
 */
export const GoalsTab: Story = {
  render: (args) => (
    <div className="py-4">
      <Page title={args.title} size="fullwidth">
        <WorkMap {...args} />
      </Page>
    </div>
  ),
  args: {
    title: "Company Work Map",
    items: mockItems,
  },
  play: async ({ canvasElement, step }) => {
    await Steps.assertRowsNumber(canvasElement, step, 14);

    await Steps.selectTab(canvasElement, step, "goals");

    await Steps.assertRowsNumber(canvasElement, step, 9);

    await Steps.assertItemName(canvasElement, step, "Acquire the first users of Operately outside Semaphore");
    await Steps.assertItemName(canvasElement, step, "Launch in European market");
  },
};

/**
 * Projects tab selected
 */
export const ProjectsTab: Story = {
  render: (args) => (
    <div className="py-4">
      <Page title={args.title} size="fullwidth">
        <WorkMap {...args} />
      </Page>
    </div>
  ),
  args: {
    title: "Company Work Map",
    items: mockItems,
  },
  play: async ({ canvasElement, step }) => {
    await Steps.assertRowsNumber(canvasElement, step, 14);

    await Steps.selectTab(canvasElement, step, "projects");

    await Steps.assertRowsNumber(canvasElement, step, 5);

    await Steps.assertItemName(canvasElement, step, "Redesign welcome screen");
    await Steps.assertItemName(canvasElement, step, "Research phase: ML model selection");

    // Paused projects are not shown
    await Steps.refuteItemName(canvasElement, step, "Release 0.4");
    await Steps.refuteItemName(canvasElement, step, "Create onboarding email sequence");

    // Completed projects are not shown
    await Steps.refuteItemName(canvasElement, step, "Legacy data migration");
  },
};

/**
 * Completed tab selected
 */
export const CompletedTab: Story = {
  render: (args) => (
    <div className="py-4">
      <Page title={args.title} size="fullwidth">
        <WorkMap {...args} />
      </Page>
    </div>
  ),
  args: {
    title: "Company Work Map",
    items: mockItems,
  },
  play: async ({ canvasElement, step }) => {
    await Steps.assertRowsNumber(canvasElement, step, 14);

    await Steps.selectTab(canvasElement, step, "completed");

    await Steps.assertRowsNumber(canvasElement, step, 3);

    await Steps.assertItemName(canvasElement, step, "Document features in Help Center");
    await Steps.assertItemName(canvasElement, step, "Legacy database migration");
    await Steps.assertItemName(canvasElement, step, "Legacy system migration to cloud infrastructure");
  },
};

/**
 * Work Map with a closed parent which has ongoing children.
 * This showcases the behavior where a closed parent is included in the filtered results
 * because it has ongoing children, even though the parent itself is closed.
 */
export const ClosedParentWithOngoingChildren: Story = {
  tags: ["autodocs"],
  render: (args) => (
    <div className="py-4">
      <Page title={args.title} size="fullwidth">
        <WorkMap {...args} />
      </Page>
    </div>
  ),
  args: {
    title: "Closed Parent with Ongoing Children",
    items: closedParentWithOngoingChildren,
  },
  play: async ({ canvasElement, step }) => {
    await Steps.selectTab(canvasElement, step, "goals");
    await Steps.assertRowsNumber(canvasElement, step, 3); // Parent + 2 goal children
    await Steps.assertItemName(canvasElement, step, "Enhance product platform architecture");

    await Steps.selectTab(canvasElement, step, "projects");
    await Steps.assertRowsNumber(canvasElement, step, 2);
    await Steps.assertItemName(canvasElement, step, "Set up CI/CD pipeline");
    await Steps.assertItemName(canvasElement, step, "Implement Consul integration");

    await Steps.selectTab(canvasElement, step, "completed");
    await Steps.assertRowsNumber(canvasElement, step, 2);
    await Steps.assertItemName(canvasElement, step, "Enhance product platform architecture");
    await Steps.assertItemName(canvasElement, step, "Implement service discovery");

    await Steps.selectTab(canvasElement, step, "all");
    await Steps.assertRowsNumber(canvasElement, step, 6); // Parent + 5 children
    await Steps.assertItemName(canvasElement, step, "Enhance product platform architecture");
    await Steps.assertItemName(canvasElement, step, "Implement service discovery");
  },
};
