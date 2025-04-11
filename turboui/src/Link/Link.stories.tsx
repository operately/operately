import type { Meta, StoryObj } from '@storybook/react';
import { Link, GhostLink } from '.';

const meta = {
  title: 'Components/Link',
  component: Link,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    to: '#',
    children: 'Default Link',
  },
};

export const WithUnderlineAlways: Story = {
  args: {
    to: '#',
    children: 'Link with Always Underline',
    underline: 'always',
  },
};

export const WithUnderlineHover: Story = {
  args: {
    to: '#',
    children: 'Link with Hover Underline',
    underline: 'hover',
  },
};

export const WithUnderlineNever: Story = {
  args: {
    to: '#',
    children: 'Link with No Underline',
    underline: 'never',
  },
};

export const WithCustomClass: Story = {
  args: {
    to: '#',
    children: 'Custom Styled Link',
    className: 'text-accent-1 font-bold',
  },
};

export const WithExternalTarget: Story = {
  args: {
    to: '#',
    children: 'External Link',
    target: '_blank',
  },
};

export const DisabledColorHoverEffect: Story = {
  args: {
    to: '#',
    children: 'Link without Hover Effect',
    disableColorHoverEffect: true,
  },
};

// GhostLink Stories
export const GhostLinkDefault: Story = {
  render: () => (
    <GhostLink
      to="#"
      text="Ghost Link"
    />
  ),
};

export const GhostLinkDimmed: Story = {
  render: () => (
    <GhostLink
      to="#"
      text="Dimmed Ghost Link"
      dimmed
    />
  ),
};

export const GhostLinkSmall: Story = {
  render: () => (
    <GhostLink
      to="#"
      text="Small Ghost Link"
      size="sm"
    />
  ),
};

export const GhostLinkExtraSmall: Story = {
  render: () => (
    <GhostLink
      to="#"
      text="Extra Small Ghost Link"
      size="xs"
    />
  ),
};
