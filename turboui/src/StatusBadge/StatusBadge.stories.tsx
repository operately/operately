import React from "react";
import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusBadge } from './index';
import { BadgeStatus } from './types';

const meta = {
  title: 'Components/StatusBadge',
  component: StatusBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      description: 'The status to display',
      control: 'select',
      options: [
        'on_track',
        'caution',
        'off_track',
        'paused',
        'achieved',
        'missed',
        'Custom Status'
      ],
    },
    hideIcon: {
      description: 'Whether to hide the status icon',
      control: 'boolean',
    },
  },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof StatusBadge>;

/**
 * Status badges are used to visually represent the current state of items like goals, projects, tasks, etc.
 * They provide an immediate visual indicator of an item's status through color coding and icons.
 */
export const Default: Story = {
  args: {
    status: 'on_track',
    hideIcon: false,
  },
};

/**
 * Progress states indicate items that are currently in progress or awaiting action.
 * 
 * - **On Track**: Item is progressing as planned with no issues.
 * - **Caution**: Item requires attention due to emerging risks or delays.
 * - **Off Track**: Item has significant problems affecting success.
 * - **Paused**: Work on the item has been temporarily halted.
 */
export const ProgressStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4" style={{ width: '500px' }}>
      <StatusBadge status="on_track" />
      <StatusBadge status="caution" />
      <StatusBadge status="off_track" />
      <StatusBadge status="paused" />
    </div>
  ),
};

/**
 * Completion states represent the final state of completed items.
 * 
 * - **Achieved/Completed**: Item was successfully completed.
 * - **Partial**: Item was partially completed or achieved.
 * - **Missed**: Item was not completed successfully by the deadline.
 * - **Dropped**: Item was intentionally abandoned.
 */
export const CompletionStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4" style={{ width: '500px' }}>
      <StatusBadge status="achieved" />
      <StatusBadge status="missed" />
    </div>
  ),
};

/**
 * For a more minimal look, badges can be displayed without icons.
 * 
 * Use the `hideIcon` prop to display badges without icons. This is useful when screen space is limited or 
 * when you want a more minimal look.
 */
export const WithoutIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4" style={{ width: '500px' }}>
      <StatusBadge status="on_track" hideIcon={true} />
      <StatusBadge status="caution" hideIcon={true} />
      <StatusBadge status="off_track" hideIcon={true} />
      <StatusBadge status="achieved" hideIcon={true} />
      <StatusBadge status="missed" hideIcon={true} />
    </div>
  ),
};

/**
 * For edge cases, you can provide a custom status string.
 * 
 * When you pass a string that doesn't match any predefined status, the component will render a neutral badge with that text.
 */
export const CustomStatus: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4" style={{ width: '500px' }}>
      <StatusBadge status="Custom Status" />
      <StatusBadge status="Another Custom" hideIcon={true} />
    </div>
  ),
};

/**
 * Status badges can be enhanced with interactive behaviors like hover effects.
 * 
 * This example demonstrates how to implement a hover effect by wrapping the StatusBadge in a div with transform classes.
 */
export const InteractiveBehaviors: Story = {
  render: () => (
    <div style={{ width: '500px' }}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left">
            <th className="py-2 px-4 text-sm font-medium">Item</th>
            <th className="py-2 px-4 text-sm font-medium">Status</th>
            <th className="py-2 px-4 text-sm font-medium">Progress</th>
          </tr>
        </thead>
        <tbody>
          <tr className="group border-b hover:bg-gray-50 transition-colors duration-150">
            <td className="py-2 px-4 text-sm">Project Alpha</td>
            <td className="py-2 px-4">
              <div className="transform group-hover:scale-105 transition-transform duration-150">
                <StatusBadge status="on_track" />
              </div>
            </td>
            <td className="py-2 px-4 text-sm">75%</td>
          </tr>
          <tr className="group border-b hover:bg-gray-50 transition-colors duration-150">
            <td className="py-2 px-4 text-sm">Goal Beta</td>
            <td className="py-2 px-4">
              <div className="transform group-hover:scale-105 transition-transform duration-150">
                <StatusBadge status="caution" />
              </div>
            </td>
            <td className="py-2 px-4 text-sm">45%</td>
          </tr>
          <tr className="group border-b hover:bg-gray-50 transition-colors duration-150">
            <td className="py-2 px-4 text-sm">Task Gamma</td>
            <td className="py-2 px-4">
              <div className="transform group-hover:scale-105 transition-transform duration-150">
                <StatusBadge status="missed" />
              </div>
            </td>
            <td className="py-2 px-4 text-sm">100%</td>
          </tr>
        </tbody>
      </table>
    </div>
  ),
};

/**
 * How to use the StatusBadge component in your code.
 */
export const AllStatuses: Story = {
  render: () => {
    // All possible status values
    const progressStatuses: BadgeStatus[] = ['on_track', 'caution', 'off_track', 'paused'];
    const completionStatuses: BadgeStatus[] = ['achieved', 'missed'];
    
    return (
      <div style={{ width: '500px' }}>
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Progress States</h3>
          <div className="flex flex-wrap gap-4">
            {progressStatuses.map(status => (
              <div key={status} className="flex flex-col items-center">
                <StatusBadge status={status} />
                <span className="text-xs mt-1 text-gray-500">{status}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Completion States</h3>
          <div className="flex flex-wrap gap-4">
            {completionStatuses.map(status => (
              <div key={status} className="flex flex-col items-center">
                <StatusBadge status={status} />
                <span className="text-xs mt-1 text-gray-500">{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
};
