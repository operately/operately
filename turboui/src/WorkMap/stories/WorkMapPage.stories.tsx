import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { WorkMapPage, WorkMap } from "../components";
import { closedParentWithOngoingChildren, mockItems, mockSingleItem } from "../tests/mockData";

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
    spaceSearch: mockSpaceSearch,
    addItem: mockAddItem,
    addItemDefaultSpace: mockSpaces[0]!,
    columnOptions: {
      hideProject: true,
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
    columnOptions: {
      hideProject: true,
    },
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
    addingEnabled: true,
    spaceSearch: mockSpaceSearch,
    addItem: mockAddItem,
    addItemDefaultSpace: mockSpaces[0]!,
    columnOptions: {
      hideProject: true,
    },
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
    columnOptions: {
      hideProject: true,
    },
  },
};
