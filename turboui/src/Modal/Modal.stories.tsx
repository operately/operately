import type { Meta, StoryObj } from "@storybook/react-vite";
import React, { useState } from "react";
import { Modal } from "./index";
import { PrimaryButton, SecondaryButton } from "../Button";
import { TextField } from "../TextField";

/**
 * Modal is a component that displays content in a layer above the app.
 * It provides a focused way to display information or collect user input.
 */
const meta: Meta<typeof Modal> = {
  title: "Components/Dialogs/Modal",
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
 * Form modal with fields and buttons
 */
export const FormModal: Story = {
  tags: ["autodocs"],
  args: {
    title: "Create New Item",
    children: (
      <div className="space-y-4">
        <TextField
          text=""
          onChange={() => {}}
          label="Title"
          placeholder="Enter title"
          variant="form-field"
          autofocus={true}
        />
        <TextField
          text=""
          onChange={() => {}}
          label="Description"
          placeholder="Enter description"
          variant="form-field"
        />
        <div className="flex justify-end space-x-2">
          <SecondaryButton>Cancel</SecondaryButton>
          <PrimaryButton>Save</PrimaryButton>
        </div>
      </div>
    ),
    size: "medium",
  },
};
