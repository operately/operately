import React from "react";
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Link, GhostLink } from '.';

/**
 * The Link component is a versatile navigation element that provides various styling options and behaviors.
 * It extends React Router's Link component with additional features like underline styles, hover effects,
 * and different visual variants.
 */
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

/**
 * The default Link variant with standard styling.
 * Features a permanent underline and color hover effect.
 */
export const Default: Story = {
  args: {
    to: '#',
    children: 'Default Link',
  },
};

/**
 * Link variant that always shows an underline.
 * @prop {"always"} underline - Forces the underline to be always visible
 */
export const WithUnderlineAlways: Story = {
  args: {
    to: '#',
    children: 'Link with Always Underline',
    underline: 'always',
  },
};

/**
 * Link variant that shows underline only on hover.
 * @prop {"hover"} underline - Shows underline only when user hovers over the link
 */
export const WithUnderlineHover: Story = {
  args: {
    to: '#',
    children: 'Link with Hover Underline',
    underline: 'hover',
  },
};

/**
 * Link variant that never shows an underline.
 * @prop {"never"} underline - Removes the underline completely
 */
export const WithUnderlineNever: Story = {
  args: {
    to: '#',
    children: 'Link with No Underline',
    underline: 'never',
  },
};

/**
 * Link with custom styling applied through className.
 * @prop {string} className - Custom CSS classes for styling
 */
export const WithCustomClass: Story = {
  args: {
    to: '#',
    children: 'Custom Styled Link',
    className: 'text-accent-1 font-bold',
  },
};

/**
 * Link that opens in a new tab/window.
 * @prop {string} target - Target attribute for the link (_blank opens in new tab)
 */
export const WithExternalTarget: Story = {
  args: {
    to: '#',
    children: 'External Link',
    target: '_blank',
  },
};

/**
 * Link without color change on hover.
 * @prop {boolean} disableColorHoverEffect - When true, disables the color change on hover
 */
export const DisabledColorHoverEffect: Story = {
  args: {
    to: '#',
    children: 'Link without Hover Effect',
    disableColorHoverEffect: true,
  },
};

/**
 * GhostLink is a minimal variant of the Link component.
 * It provides a clean, unobtrusive look with hover underline effect.
 */
export const GhostLinkDefault: Story = {
  args: {
    to: '#',
    children: 'Ghost Link',
  },
  render: () => (
    <GhostLink
      to="#"
      text="Ghost Link"
    />
  ),
};

/**
 * Dimmed variant of GhostLink with reduced opacity.
 * @prop {boolean} dimmed - Applies a dimmed text color
 */
export const GhostLinkDimmed: Story = {
  args: {
    to: '#',
    children: 'Ghost Link',
  },
  render: () => (
    <GhostLink
      to="#"
      text="Dimmed Ghost Link"
      dimmed
    />
  ),
};

/**
 * Small-sized variant of GhostLink.
 * @prop {"sm"} size - Applies small text size
 */
export const GhostLinkSmall: Story = {
  args: {
    to: '#',
    children: 'Ghost Link',
  },
  render: () => (
    <GhostLink
      to="#"
      text="Small Ghost Link"
      size="sm"
    />
  ),
};

/**
 * Extra small-sized variant of GhostLink.
 * @prop {"xs"} size - Applies extra small text size
 */
export const GhostLinkExtraSmall: Story = {
  args: {
    to: '#',
    children: 'Extra Small Ghost Link',
  },
  render: () => (
    <GhostLink
      to="#"
      text="Extra Small Ghost Link"
      size="xs"
    />
  ),
};
