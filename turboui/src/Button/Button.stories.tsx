import type { Meta, StoryObj } from '@storybook/react';
import { PrimaryButton, SecondaryButton, GhostButton } from './index';

const meta = {
  title: 'Components/Button',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;

export const Primary: StoryObj = {
  render: (args) => <PrimaryButton {...args}>Primary Button</PrimaryButton>,
  args: {
    size: 'base',
    loading: false,
  },
};

export const Secondary: StoryObj = {
  render: (args) => <SecondaryButton {...args}>Secondary Button</SecondaryButton>,
  args: {
    size: 'base',
    loading: false,
  },
};

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
      <PrimaryButton loading>Loading</PrimaryButton>
      <SecondaryButton loading>Loading</SecondaryButton>
      <GhostButton loading>Loading</GhostButton>
    </div>
  ),
};

export const Sizes: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <PrimaryButton size="xxs">XXS</PrimaryButton>
        <PrimaryButton size="xs">XS</PrimaryButton>
        <PrimaryButton size="sm">SM</PrimaryButton>
        <PrimaryButton size="base">Base</PrimaryButton>
        <PrimaryButton size="lg">LG</PrimaryButton>
      </div>
      <div className="flex gap-4">
        <SecondaryButton size="xxs">XXS</SecondaryButton>
        <SecondaryButton size="xs">XS</SecondaryButton>
        <SecondaryButton size="sm">SM</SecondaryButton>
        <SecondaryButton size="base">Base</SecondaryButton>
        <SecondaryButton size="lg">LG</SecondaryButton>
      </div>
      <div className="flex gap-4">
        <GhostButton size="xxs">XXS</GhostButton>
        <GhostButton size="xs">XS</GhostButton>
        <GhostButton size="sm">SM</GhostButton>
        <GhostButton size="base">Base</GhostButton>
        <GhostButton size="lg">LG</GhostButton>
      </div>
    </div>
  ),
};