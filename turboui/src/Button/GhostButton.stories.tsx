import type { Meta, StoryObj } from '@storybook/react';
import { GhostButton } from './index';

const meta = {
  title: 'TurboUI/Button/GhostButton',
  component: GhostButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    children: { control: 'text' },
    size: { 
      control: { type: 'select' }, 
      options: ['xxs', 'xs', 'sm', 'base', 'lg'] 
    },
    loading: { control: 'boolean' },
    onClick: { action: 'clicked' },
  },
} satisfies Meta<typeof GhostButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Ghost Button',
    size: 'base',
    loading: false,
  },
};

export const Small: Story = {
  args: {
    children: 'Small Ghost',
    size: 'sm',
    loading: false,
  },
};

export const Loading: Story = {
  args: {
    children: 'Loading Ghost',
    size: 'base',
    loading: true,
  },
};