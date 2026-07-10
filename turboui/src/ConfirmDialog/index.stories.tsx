import type { Meta, StoryObj } from "@storybook/react-vite";
import React, { useState } from "react";
import { ConfirmDialog } from "./index";
import { PrimaryButton } from "../Button";

/**
 * ConfirmDialog is a reusable dialog component for destructive confirmation actions.
 * Similar to Radix Alert Dialog, it's designed for dangerous actions that require confirmation.
 */
const meta: Meta<typeof ConfirmDialog> = {
  title: "Components/Dialogs/ConfirmDialog",
  component: ConfirmDialog,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    title: { control: "text" },
    message: { control: "text" },
    confirmText: { control: "text" },
    cancelText: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof ConfirmDialog>;

/**
 * Destructive confirmation dialog for dangerous actions
 */
export const Default: Story = {
  tags: ["autodocs"],
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <div className="p-4">
        <PrimaryButton onClick={() => setIsOpen(true)}>
          Delete Item
        </PrimaryButton>
        <ConfirmDialog
          {...args}
          isOpen={isOpen}
          onConfirm={() => {
            console.log("Item deleted");
            setIsOpen(false);
          }}
          onCancel={() => {
            console.log("Delete cancelled");
            setIsOpen(false);
          }}
        />
      </div>
    );
  },
  args: {
    title: "Delete Item",
    message: "Are you sure you want to delete this item? This action cannot be undone.",
    confirmText: "Delete",
    cancelText: "Cancel",
    variant: "danger",
  },
};