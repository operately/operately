import type { Meta, StoryObj } from '@storybook/react';
import { Chronometer } from '.';

const meta = {
  title: 'Components/Chronometer',
  component: Chronometer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Chronometer>;

export default meta;
type Story = StoryObj<typeof meta>;

const now = new Date();
const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

export const Default: Story = {
  args: {
    start: oneMonthAgo,
    end: oneMonthFromNow,
  },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
};

export const Responsiveness: Story = {
  args: {
    start: oneMonthAgo,
    end: oneMonthFromNow,
  },
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="w-48">
          <Story />
        </div>
        <div className="w-64">
          <Story />
        </div>
        <div className="w-96">
          <Story />
        </div>
      </div>
    ),
  ],
};

export const NotStartedYet: Story = {
  args: {
    start: oneMonthFromNow,
    end: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
  },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
};

export const Completed: Story = {
  args: {
    start: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
    end: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
  },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
};

export const VariousDateScenarios: Story = {
  args: {
    start: new Date(now.getTime()),
    end: new Date(now.getTime() + 24 * 60 * 60 * 1000), // One day duration
  },
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="w-64">
          <p className="text-xs mb-2">One day duration:</p>
          <Story />
        </div>

        <div className="w-64">
          <p className="text-xs mb-2">Cross-year duration:</p>
          <Chronometer
            start={new Date(now.getFullYear(), 11, 15)} // December 15th current year
            end={new Date(now.getFullYear() + 1, 1, 15)} // February 15th next year
          />
        </div>

        <div className="w-64">
          <p className="text-xs mb-2">Multi-year duration:</p>
          <Chronometer
            start={new Date(now.getFullYear(), 1, 1)} // January 1st current year
            end={new Date(now.getFullYear() + 2, 11, 31)} // December 31st two years later
          />
        </div>

        <div className="w-64">
          <p className="text-xs mb-2">Previous year duration:</p>
          <Chronometer
            start={new Date(now.getFullYear() - 1, 5, 1)} // June 1st last year
            end={new Date(now.getFullYear() - 1, 11, 31)} // December 31st last year
            color="stone"
          />
        </div>
      </div>
    ),
  ],
};
