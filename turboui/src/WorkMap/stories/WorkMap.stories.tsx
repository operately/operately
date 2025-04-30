import type { Meta, StoryObj } from "@storybook/react";
import WorkMap from "../components";
import { Page } from "../../Page";
import * as Steps from "../tests/steps";
import { mockItems, mockSingleItem } from "../tests/mockData";

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
  },
  play: async ({ canvasElement, step }) => {
    await Steps.assertRowsNumber(canvasElement, step, 0);
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
    await Steps.assertRowsNumber(canvasElement, step, 15);

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
    await Steps.assertRowsNumber(canvasElement, step, 15);

    await Steps.selectTab(canvasElement, step, "projects");

    await Steps.assertRowsNumber(canvasElement, step, 6);

    await Steps.assertItemName(canvasElement, step, "Release 0.4");
    await Steps.assertItemName(canvasElement, step, "Research phase: ML model selection");
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
    await Steps.assertRowsNumber(canvasElement, step, 15);

    await Steps.selectTab(canvasElement, step, "completed");

    await Steps.assertRowsNumber(canvasElement, step, 1);

    await Steps.assertItemName(canvasElement, step, "Document features in Help Center");
  },
};

/**
 * Year 2023 selected
 */
export const Year2023Selected: Story = {
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
    await Steps.assertRowsNumber(canvasElement, step, 15);

    await Steps.openTimeframeSelector(canvasElement, step);

    await Steps.selectYear(canvasElement, step, "2023");

    await Steps.closeTimeframeSelector(canvasElement, step);

    await Steps.assertRowsNumber(canvasElement, step, 0);

    await Steps.selectTab(canvasElement, step, "completed");

    await Steps.assertRowsNumber(canvasElement, step, 1);

    await Steps.assertItemName(canvasElement, step, "Legacy system migration to cloud infrastructure");
  },
};

/**
 * Year 2028 selected
 */
export const Year2028Selected: Story = {
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
    await Steps.assertRowsNumber(canvasElement, step, 15);

    await Steps.openTimeframeSelector(canvasElement, step);

    await Steps.selectYear(canvasElement, step, "2028");

    await Steps.closeTimeframeSelector(canvasElement, step);

    await Steps.assertRowsNumber(canvasElement, step, 1);

    await Steps.assertItemName(canvasElement, step, "Develop sustainable AI-powered analytics platform");
  },
};

/**
 * Q3 quarter selected
 */
export const Q3Selected: Story = {
  name: "Q3 selected",
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
    await Steps.assertRowsNumber(canvasElement, step, 15);

    await Steps.openTimeframeSelector(canvasElement, step);

    await Steps.selectQuarter(canvasElement, step, "Q3");

    await Steps.closeTimeframeSelector(canvasElement, step);

    await Steps.assertRowsNumber(canvasElement, step, 7);

    await Steps.assertItemName(canvasElement, step, "Acquire the first users of Operately outside Semaphore");
    await Steps.assertItemName(canvasElement, step, "GDPR compliance implementation");
  },
};

/**
 * November month selected
 */
export const NovemberSelected: Story = {
  name: "November selected",
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
    await Steps.assertRowsNumber(canvasElement, step, 15);

    await Steps.openTimeframeSelector(canvasElement, step);

    await Steps.selectMonth(canvasElement, step, "November");

    await Steps.closeTimeframeSelector(canvasElement, step);

    await Steps.assertRowsNumber(canvasElement, step, 6);

    await Steps.assertItemName(canvasElement, step, "Increase user engagement by 50%");
    await Steps.assertItemName(canvasElement, step, "Expand to international markets");
  },
};
