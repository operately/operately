import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { WorkMapPage } from "../components";
import { closedParentWithOngoingChildren, mockItems, mockSingleItem } from "../tests/mockData";

/**
 * WorkMapPage is a comprehensive page for displaying and interacting with
 * hierarchical work items like goals and projects.
 */
const meta = {
  title: "Pages/WorkMapPage",
  component: WorkMapPage,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    items: { control: "object" },
  },
} satisfies Meta<typeof WorkMapPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default view of the WorkMap with multiple items and children
 */
export const Default: Story = {
  render: (args) => <WorkMapPage {...args} />,
  args: {
    title: "Company Work Map",
    items: mockItems,
    addingEnabled: true,
    spaceSearch: async ({ query }) => {
      return [
        { id: "space1", name: "Space 1", link: "/spaces/space1" },
        { id: "space2", name: "Space 2", link: "/spaces/space2" },
      ].filter((space) => space.name.toLowerCase().includes(query));
    },
    addItem: async (props) => {
      console.log("Saving new item:", props);
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ id: "new-item-id" });
        }, 1000);
      });
    },
  },
};

/**
 * WorkMap with a single item (no children)
 */
export const SingleItem: Story = {
  render: (args) => <WorkMapPage {...args} />,
  args: {
    title: "Company Work Map",
    items: [mockSingleItem],
  },
};

/**
 * WorkMap with no items (empty state)
 */
export const Empty: Story = {
  render: (args) => <WorkMapPage {...args} />,
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
  render: (args) => <WorkMapPage {...args} />,
  args: {
    title: "Closed Parent with Ongoing Children",
    items: closedParentWithOngoingChildren,
  },
};
