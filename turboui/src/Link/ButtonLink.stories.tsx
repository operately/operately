import type { Meta, StoryObj } from '@storybook/react';
import { ButtonLink } from './index';

const meta = {
  title: 'TurboUI/Link/ButtonLink',
  component: ButtonLink,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    children: { control: 'text' },
    onClick: { action: 'clicked' },
    testId: { control: 'text' },
  },
} satisfies Meta<typeof ButtonLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Click Me',
    testId: 'button-link',
  },
};

export const WithIcon: Story = {
  args: {
    children: <>🔗 Link with Icon</>,
    testId: 'button-link-icon',
  },
};