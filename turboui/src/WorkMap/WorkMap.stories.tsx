import type { Meta, StoryObj } from '@storybook/react';
import { WorkMap } from './index';
import { WorkMapItem, Status } from './types';

// --- Mock Data ---
function genAvatar(id: string) {
  return `https://images.unsplash.com/${id}?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80`;
}

// People used consistently throughout the stories
const people = {
  alex: {
    id: "user-alex",
    fullName: "Alex R.",
    avatarUrl: genAvatar("photo-1500648767791-00dcc994a43e"),
  },
  sophia: {
    id: "user-sophia",
    fullName: "Sophia T.",
    avatarUrl: genAvatar("photo-1438761681033-6461ffad8d80"),
  },
  jennifer: {
    id: "user-jennifer",
    fullName: "Jennifer L.",
    avatarUrl: genAvatar("photo-1494790108377-be9c29b29330"),
  },
};

// Sample work map items
const mockItems: WorkMapItem[] = [
  {
    id: "goal-1",
    type: "goal",
    name: "Acquire the first users of Operately outside Semaphore",
    status: "on_track",
    progress: 45,
    space: "General",
    owner: people.alex,
    deadline: {
      display: "Dec 31 2024",
      isPast: false,
    },
    nextStep: "People are signing up for SaaS",
    children: [
      {
        id: "project-1",
        type: "project",
        name: "Document features in Help Center",
        status: "completed",
        progress: 100,
        space: "Product",
        owner: people.sophia,
        deadline: {
          display: "Mar 31",
          isPast: false,
        },
        closedAt: "Mar 10 2025",
        nextStep: "",
        children: [],
      },
      {
        id: "project-2",
        type: "project",
        name: "Release 0.4",
        status: "paused",
        progress: 30,
        space: "Product",
        owner: people.alex,
        deadline: {
          display: "Feb 7",
          isPast: true,
        },
        nextStep: "All weekly updates are collected",
        children: [],
      },
    ],
  },
  {
    id: "goal-2",
    type: "goal",
    name: "Improve customer onboarding experience",
    status: "caution",
    progress: 25,
    space: "R&D",
    owner: people.jennifer,
    deadline: {
      display: "Jun 15 2025",
      isPast: false,
    },
    nextStep: "Conduct user interviews",
    children: [],
  },
];

/**
 * WorkMap is a comprehensive component for displaying and interacting with
 * hierarchical work items like goals and projects.
 */
const meta = {
  title: 'Components/WorkMap/WorkMap',
  component: WorkMap,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    items: { control: 'object' },
    addItem: { action: 'addItem' },
    deleteItem: { action: 'deleteItem' },
  },
} satisfies Meta<typeof WorkMap>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default view of the WorkMap with multiple items and children
 */
export const Default: Story = {
  render: (args) => (
    <div className="px-8 py-8">
      <WorkMap {...args} />
    </div>
  ),
  args: {
    items: mockItems,
    addItem: (newItem) => console.log('Add item', newItem),
    deleteItem: (itemId) => console.log('Delete item', { itemId }),
  },
};

/**
 * WorkMap with a single item (no children)
 */
export const SingleItem: Story = {
  render: (args) => (
    <div className="px-8 py-8">
      <WorkMap {...args} />
    </div>
  ),
  args: {
    items: [mockItems[1]], // Just the second goal with no children
    addItem: (newItem) => console.log('Add item', newItem),
    deleteItem: (itemId) => console.log('Delete item', { itemId }),
  },
};

/**
 * WorkMap with no items (empty state)
 */
export const Empty: Story = {
  render: (args) => (
    <div className="px-8 py-8">
      <WorkMap {...args} />
    </div>
  ),
  args: {
    items: [],
    addItem: (newItem) => console.log('Add item', newItem),
    deleteItem: (itemId) => console.log('Delete item', { itemId }),
  },
};

/**
 * WorkMap with all items in different statuses to showcase status badges
 */
export const AllStatuses: Story = {
  render: (args) => (
    <div className="px-8 py-8">
      <WorkMap {...args} />
    </div>
  ),
  args: {
    items: [
      // Create an item for each possible status
      ...(['on_track', 'completed', 'achieved', 'partial', 'missed', 'paused', 
          'caution', 'issue', 'dropped', 'pending'] as Status[]).map((status, index) => ({
        id: `status-${index}`,
        type: index % 2 === 0 ? 'goal' : 'project' as 'goal' | 'project',
        name: `${status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')} item`,
        status,
        progress: status === 'completed' || status === 'achieved' ? 100 : Math.floor(Math.random() * 100),
        space: ['Product', 'Engineering', 'Marketing', 'Sales', 'R&D'][index % 5],
        owner: {
          id: `user-${index}`,
          fullName: `User ${index + 1}`,
          avatarUrl: index % 2 === 0 ? people.alex.avatarUrl : people.sophia.avatarUrl,
        },
        deadline: status === 'completed' || status === 'achieved' ? undefined : {
          display: `Jun ${15 + index} 2025`,
          isPast: ['missed', 'partial'].includes(status),
        },
        completedOn: status === 'completed' || status === 'achieved' ? {
          display: `Apr ${index + 1} 2025`,
        } : undefined,
        nextStep: status === 'completed' || status === 'achieved' ? '' : 'Next action to take',
        children: [],
      })),
    ],
    addItem: (newItem) => console.log('Add item', newItem),
    deleteItem: (itemId) => console.log('Delete item', { itemId }),
  },
};
