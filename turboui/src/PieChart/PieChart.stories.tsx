import React from "react";
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PieChart } from './index';

const meta = {
  title: 'Components/PieChart',
  component: PieChart,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      description: 'The diameter of the pie chart in pixels',
      control: { type: 'number' }
    },
    bgcolor: {
      description: 'The background color of the pie chart',
      control: { type: 'text' }
    },
    slices: {
      description: 'Array of slice objects, each containing percentage and color',
      control: 'object'
    }
  }
} satisfies Meta<typeof PieChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default PieChart configuration demonstrates a typical usage with multiple segments.
 * Use this when you need to:
 * - Visualize proportional data
 * - Show percentage breakdowns
 * - Display part-to-whole relationships
 */
export const Default: Story = {
  args: {
    size: 100,
    slices: [
      { percentage: 60, color: 'var(--color-green-500)' },
    ],
  },
};

export const Sizes: Story = {
  args: {
    size: 30,
    bgcolor: "var(--color-zinc-200)",
    slices: [
      { percentage: 30, color: 'green' }
    ],
  },
  decorators: [
    () => (
      <div className="flex items-center space-x-4">
        <PieChart size={10} slices={[{ percentage: 30, color: 'green' }]} />
        <PieChart size={15} slices={[{ percentage: 30, color: 'green' }]} />
        <PieChart size={20} slices={[{ percentage: 30, color: 'green' }]} />
        <PieChart size={25} slices={[{ percentage: 30, color: 'green' }]} />
        <PieChart size={30} slices={[{ percentage: 30, color: 'green' }]} />
        <PieChart size={50} slices={[{ percentage: 30, color: 'green' }]} />
        <PieChart size={100} slices={[{ percentage: 30, color: 'green' }]} />
      </div>
    ),
  ]
};

/**
 * Equal parts variant is useful for:
 * - Displaying evenly distributed data
 * - Showing equal probability scenarios
 * - Visualizing balanced distributions or fair shares
 * - Demonstrating quarter or equal division patterns
 */
export const MultipleSlices: Story = {
  args: {
    size: 100,
    slices: [
      { percentage: 20, color: 'green' },
      { percentage: 20, color: 'red' },
      { percentage: 20, color: 'blue' },
      { percentage: 20, color: 'yellow' }
    ],
  },
  decorators: [
    () => (
      <div className="flex items-center space-x-4">
        <PieChart size={100} slices={[{ percentage: 20, color: 'green' }]} />
        <PieChart size={100} slices={[{ percentage: 20, color: 'green' }, { percentage: 20, color: 'red' }]} />
        <PieChart size={100} slices={[{ percentage: 20, color: 'green' }, { percentage: 20, color: 'red' }]} />
        <PieChart size={100} slices={[{ percentage: 20, color: 'green' }, { percentage: 20, color: 'red' }, {percentage: 20, color: 'blue'}]} />
        <PieChart size={100} slices={[{ percentage: 20, color: 'green' }, { percentage: 20, color: 'red' }, {percentage: 20, color: 'blue'}, {percentage: 20, color: 'yellow'}]} />
      </div>
    ),
  ]
};
