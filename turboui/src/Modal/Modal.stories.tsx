import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { Modal } from "./index";
import { PrimaryButton, SecondaryButton } from "../Button";

/**
 * Modal is a component that displays content in a layer above the app.
 * It provides a focused way to display information or collect user input.
 */
const meta: Meta<typeof Modal> = {
  title: "Components/Modal",
  component: Modal,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    isOpen: { control: "boolean" },
    title: { control: "text" },
    size: { control: "select", options: ["small", "medium", "large"] },
    closeOnBackdropClick: { control: "boolean" },
  },
  decorators: [
    (Story, context) => {
      const [isOpen, setIsOpen] = useState(context.args.isOpen || false);
      
      // Override isOpen and onClose to allow the story to control the modal state
      return (
        <div className="p-4">
          <PrimaryButton onClick={() => setIsOpen(true)}>Open Modal</PrimaryButton>
          <Story args={{ ...context.args, isOpen, onClose: () => setIsOpen(false) }} />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof Modal>;

/**
 * Basic modal with a title and content
 */
export const Basic: Story = {
  tags: ["autodocs"],
  args: {
    title: "Modal Title",
    children: (
      <div className="space-y-4">
        <p>This is the modal content.</p>
        <div className="flex justify-end">
          <SecondaryButton>Close</SecondaryButton>
        </div>
      </div>
    ),
    size: "medium",
  },
};

/**
 * Small modal for simple content
 */
export const Small: Story = {
  tags: ["autodocs"],
  args: {
    title: "Small Modal",
    children: (
      <div className="space-y-4">
        <p>This is a small modal.</p>
        <div className="flex justify-end">
          <SecondaryButton>Close</SecondaryButton>
        </div>
      </div>
    ),
    size: "small",
  },
};

/**
 * Large modal for complex content
 */
export const Large: Story = {
  tags: ["autodocs"],
  args: {
    title: "Large Modal",
    children: (
      <div className="space-y-4">
        <p>This is a large modal with more content.</p>
        <p>It's useful for displaying complex forms or a lot of information.</p>
        <p>The extra space helps organize the content and keeps it from feeling cramped.</p>
        <div className="flex justify-end space-x-2">
          <SecondaryButton>Cancel</SecondaryButton>
          <PrimaryButton>Submit</PrimaryButton>
        </div>
      </div>
    ),
    size: "large",
  },
};

/**
 * Form modal with fields and buttons
 */
export const FormModal: Story = {
  tags: ["autodocs"],
  args: {
    title: "Create New Item",
    children: (
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">Title</label>
          <input
            id="title"
            type="text"
            className="w-full px-3 py-2 border border-surface-outline rounded-md"
            placeholder="Enter title"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
          <textarea
            id="description"
            rows={3}
            className="w-full px-3 py-2 border border-surface-outline rounded-md"
            placeholder="Enter description"
          />
        </div>
        <div className="flex justify-end space-x-2">
          <SecondaryButton>Cancel</SecondaryButton>
          <PrimaryButton>Save</PrimaryButton>
        </div>
      </div>
    ),
    size: "medium",
  },
};
