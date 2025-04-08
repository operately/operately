import type { Meta, StoryObj } from '@storybook/react';
import { SecondaryButton } from './index';

const meta = {
  title: 'TurboUI/Button/SecondaryButton',
  component: SecondaryButton,
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
} satisfies Meta<typeof SecondaryButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Secondary Button',
    size: 'base',
    loading: false,
  },
};

export const Small: Story = {
  args: {
    children: 'Small Secondary',
    size: 'sm',
    loading: false,
  },
};

export const Loading: Story = {
  args: {
    children: 'Loading Secondary',
    size: 'base',
    loading: true,
  },
};