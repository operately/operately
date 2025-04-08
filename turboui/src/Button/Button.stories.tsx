import type { Meta, StoryObj } from '@storybook/react';
import { PrimaryButton, SecondaryButton, GhostButton } from './index';

const meta = {
  title: 'Components/Button',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      description: 'The size of the button',
      options: ['xxs', 'xs', 'sm', 'base', 'lg'],
      control: { type: 'select' },
    },
    loading: {
      description: 'Whether the button is in a loading state',
      control: { type: 'boolean' },
    },
  },
} satisfies Meta;

export default meta;

/**
 * Primary buttons are used for the main action in a section or page.
 * Use them for:
 * - The primary action in a form (e.g., Submit, Save)
 * - Main calls-to-action
 * - Actions that complete a process
 */
export const Primary: StoryObj = {
  render: (args) => <PrimaryButton {...args}>Primary Button</PrimaryButton>,
  args: {
    size: 'base',
    loading: false,
  },
};

/**
 * Secondary buttons are used for alternative actions that are not the primary focus.
 * Use them for:
 * - Secondary actions in forms (e.g., Cancel, Back)
 * - Alternative options
 * - Less important actions when paired with a Primary button
 */
export const Secondary: StoryObj = {
  render: (args) => <SecondaryButton {...args}>Secondary Button</SecondaryButton>,
  args: {
    size: 'base',
    loading: false,
  },
};

/**
 * Ghost buttons are the least prominent button style.
 * Use them for:
 * - Tertiary actions
 * - Actions in compact spaces
 * - Actions that should be visually subtle
 * - Interface actions that need to be present but not highlighted
 */
export const Ghost: StoryObj = {
  render: (args) => <GhostButton {...args}>Ghost Button</GhostButton>,
  args: {
    size: 'base',
    loading: false,
  },
};

export const LoadingStates: StoryObj = {
  render: () => (
    <div className="flex gap-4">
      <PrimaryButton loading>Button</PrimaryButton>
      <SecondaryButton loading>Button</SecondaryButton>
      <GhostButton loading>Button</GhostButton>
    </div>
  ),
};

/**
 * Different size variants are available to accommodate various use cases:
 * - xxs (Extra Extra Small): For very compact interfaces like data tables or tight layouts
 * - xs (Extra Small): For secondary actions in compact spaces
 * - sm (Small): For most secondary actions and form controls
 * - base (Base): Default size, for primary actions and most common use cases
 * - lg (Large): For prominent calls to action or when additional emphasis is needed
 */
export const Sizes: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <PrimaryButton size="xxs">Button</PrimaryButton>
        <PrimaryButton size="xs">Button</PrimaryButton>
        <PrimaryButton size="sm">Button</PrimaryButton>
        <PrimaryButton size="base">Button</PrimaryButton>
        <PrimaryButton size="lg">Button</PrimaryButton>
      </div>
      <div className="flex items-center gap-4">
        <SecondaryButton size="xxs">Button</SecondaryButton>
        <SecondaryButton size="xs">Button</SecondaryButton>
        <SecondaryButton size="sm">Button</SecondaryButton>
        <SecondaryButton size="base">Button</SecondaryButton>
        <SecondaryButton size="lg">Button</SecondaryButton>
      </div>
      <div className="flex items-center gap-4">
        <GhostButton size="xxs">Button</GhostButton>
        <GhostButton size="xs">Button</GhostButton>
        <GhostButton size="sm">Button</GhostButton>
        <GhostButton size="base">Button</GhostButton>
        <GhostButton size="lg">Button</GhostButton>
      </div>
    </div>
  ),
};