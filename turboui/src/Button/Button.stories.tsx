import type { Meta, StoryObj } from '@storybook/react';
import { PrimaryButton, GhostButton, SecondaryButton } from './index';

// Meta for PrimaryButton
const primaryMeta = {
  title: 'TurboUI/Button/PrimaryButton',
  component: PrimaryButton,
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
} satisfies Meta<typeof PrimaryButton>;

export default primaryMeta;
type Story = StoryObj<typeof primaryMeta>;

export const Default: Story = {
  args: {
    children: 'Primary Button',
    size: 'base',
    loading: false,
  },
};

export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'sm',
    loading: false,
  },
};

export const Loading: Story = {
  args: {
    children: 'Loading Button',
    size: 'base',
    loading: true,
  },
};