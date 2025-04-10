import type { Meta, StoryObj } from '@storybook/react';
import { PieChart, COLORS } from './index';

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
    total: {
      description: 'The total value that represents 100% of the pie chart',
      control: { type: 'number' }
    },
    slices: {
      description: 'Array of slice objects, each containing size (value) and color',
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
    total: 100,
    slices: [
      { size: 60, color: 'green' },
      { size: 30, color: 'yellow' },
      { size: 10, color: 'red' },
    ],
  },
};

/**
 * Small variant (50px) is ideal for:
 * - Compact layouts
 * - Inline visualizations
 * - Status indicators where space is limited
 */
export const Small: Story = {
  args: {
    size: 50,
    total: 100,
    slices: [
      { size: 75, color: 'green' },
      { size: 25, color: 'red' },
    ],
  },
};

/**
 * Large variant (200px) is suitable for:
 * - Featured data visualization
 * - Dashboard focal points
 * - When detail and visibility are priorities
 * - Complex data sets with multiple segments
 */
export const Large: Story = {
  args: {
    size: 200,
    total: 100,
    slices: [
      { size: 40, color: 'green' },
      { size: 30, color: 'yellow' },
      { size: 20, color: 'red' },
      { size: 10, color: 'gray' },
    ],
  },
};

/**
 * Single color variant demonstrates:
 * - Complete or 100% scenarios
 * - Simple progress indicators
 * - When only one category or value needs to be shown
 */
export const SingleColor: Story = {
  args: {
    size: 100,
    total: 100,
    slices: [
      { size: 100, color: 'green' },
    ],
  },
};

/**
 * Equal parts variant is useful for:
 * - Displaying evenly distributed data
 * - Showing equal probability scenarios
 * - Visualizing balanced distributions or fair shares
 * - Demonstrating quarter or equal division patterns
 */
export const EqualParts: Story = {
  args: {
    size: 100,
    total: 100,
    slices: [
      { size: 25, color: 'green' },
      { size: 25, color: 'yellow' },
      { size: 25, color: 'red' },
      { size: 25, color: 'gray' },
    ],
  },
};
