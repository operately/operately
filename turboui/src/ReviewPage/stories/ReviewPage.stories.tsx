import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ReviewPage } from "../index";
import * as data from "./mockData";

/**
 * ReviewPage is a comprehensive page for managing and reviewing work assignments.
 * It displays both work items that need action from the user and items that need review.
 */
const meta = {
  title: "Pages/ReviewPage",
  component: ReviewPage,
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
    assignments: { control: "object" },
    myWork: { control: "object" },
    forReview: { control: "object" },
    assignmentsCount: { control: "number" },
  },
} satisfies Meta<typeof ReviewPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default view of the Review page with both my work and items for review
 */
export const Default: Story = {
  render: (args) => <ReviewPage {...args} />,
  args: {
    assignments: [...data.mockMyWorkAssignments, ...data.mockForReviewAssignments],
    assignmentsCount: data.mockMyWorkAssignments.length + data.mockForReviewAssignments.length,
    myWork: data.mockMyWorkAssignments,
    forReview: data.mockForReviewAssignments,
  },
};

/**
 * Review page with only my work assignments (no items for review)
 */
export const MyWorkOnly: Story = {
  render: (args) => <ReviewPage {...args} />,
  args: {
    assignments: data.mockMyWorkAssignments,
    assignmentsCount: data.mockMyWorkAssignments.length,
    myWork: data.mockMyWorkAssignments,
    forReview: [],
  },
};

/**
 * Review page with only items for review (no my work assignments)
 */
export const ForReviewOnly: Story = {
  render: (args) => <ReviewPage {...args} />,
  args: {
    assignments: data.mockForReviewAssignments,
    assignmentsCount: data.mockForReviewAssignments.length,
    myWork: [],
    forReview: data.mockForReviewAssignments,
  },
};

/**
 * Review page with no assignments (empty state)
 */
export const Empty: Story = {
  render: (args) => <ReviewPage {...args} />,
  args: {
    assignments: [],
    assignmentsCount: 0,
    myWork: [],
    forReview: [],
  },
};

/**
 * Review page with single items in each section
 */
export const SingleItems: Story = {
  render: (args) => <ReviewPage {...args} />,
  args: {
    assignments: [...data.mockSingleMyWorkAssignment, ...data.mockSingleForReviewAssignment],
    assignmentsCount: 2,
    myWork: data.mockSingleMyWorkAssignment,
    forReview: data.mockSingleForReviewAssignment,
  },
};

/**
 * Review page with overdue assignments showing urgent items
 */
export const WithOverdueItemsExample: Story = {
  render: (args) => <ReviewPage {...args} />,
  args: {
    assignments: [...data.mockSingleMyWorkAssignment, ...data.mockSingleForReviewAssignment],
    assignmentsCount: 2,
    myWork: data.mockSingleMyWorkAssignment,
    forReview: data.mockSingleForReviewAssignment,
  },
};

/**
 * Review page with overdue assignments showing urgent items
 */
export const WithOverdueItems: Story = {
  render: (args) => <ReviewPage {...args} />,
  args: {
    assignments: [...data.mockOverdueAssignments, ...data.mockForReviewAssignments],
    assignmentsCount: data.mockOverdueAssignments.length + data.mockForReviewAssignments.length,
    myWork: data.mockOverdueAssignments,
    forReview: data.mockForReviewAssignments,
  },
};

/**
 * Review page with a large number of assignments to test scrolling and performance
 */
export const ManyAssignments: Story = {
  render: (args) => <ReviewPage {...args} />,
  args: {
    assignments: [
      ...data.mockMyWorkAssignments,
      ...data.mockMyWorkAssignments.map((item, index) => ({
        ...item,
        resourceId: `${item.resourceId}-copy-${index}`,
        name: `${item.name} (Copy ${index + 1})`,
      })),
      ...data.mockForReviewAssignments,
      ...data.mockForReviewAssignments.map((item, index) => ({
        ...item,
        resourceId: `${item.resourceId}-copy-${index}`,
        name: `${item.name} (Copy ${index + 1})`,
      })),
    ],
    assignmentsCount: (data.mockMyWorkAssignments.length + data.mockForReviewAssignments.length) * 2,
    myWork: [
      ...data.mockMyWorkAssignments,
      ...data.mockMyWorkAssignments.map((item, index) => ({
        ...item,
        resourceId: `${item.resourceId}-copy-${index}`,
        name: `${item.name} (Copy ${index + 1})`,
      })),
    ],
    forReview: [
      ...data.mockForReviewAssignments,
      ...data.mockForReviewAssignments.map((item, index) => ({
        ...item,
        resourceId: `${item.resourceId}-copy-${index}`,
        name: `${item.name} (Copy ${index + 1})`,
      })),
    ],
  },
};