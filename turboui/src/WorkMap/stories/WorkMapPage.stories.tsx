import type { Meta, StoryObj } from "@storybook/react";
import WorkMap from "../components";
import { Page } from "../../Page";
import { mockItems, mockSingleItem, closedParentWithOngoingChildren } from "../tests/mockData";

/**
 * WorkMapPage is a comprehensive page for displaying and interacting with
 * hierarchical work items like goals and projects.
 */
const meta = {
  title: "Pages/WorkMapPage",
  component: WorkMap,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="sm:mt-12">
        <Story />
      </div>
    ),
  ],
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
  render: (args) => (
    <Page title={args.title} size="fullwidth">
      <WorkMap {...args} />
    </Page>
  ),
  args: {
    title: "Company Work Map",
    items: mockItems,
  },
};

/**
 * WorkMap with a single item (no children)
 */
export const SingleItem: Story = {
  render: (args) => (
    <Page title={args.title} size="fullwidth">
      <WorkMap {...args} />
    </Page>
  ),
  args: {
    title: "Company Work Map",
    items: [mockSingleItem],
  },
};

/**
 * WorkMap with no items (empty state)
 */
export const Empty: Story = {
  render: (args) => (
    <Page title={args.title} size="fullwidth">
      <WorkMap {...args} />
    </Page>
  ),
  args: {
    title: "Company Work Map",
    items: [],
  },
};

/**
 * Work Map with a closed parent which has ongoing children.
 * This showcases the behavior where a closed parent is included in the filtered results
 * because it has ongoing children, even though the parent itself is closed.
 */
export const ClosedParentWithOngoingChildren: Story = {
  render: (args) => (
    <Page title={args.title} size="fullwidth">
      <WorkMap {...args} />
    </Page>
  ),
  args: {
    title: "Closed Parent with Ongoing Children",
    items: closedParentWithOngoingChildren,
  },
};
