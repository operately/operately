import type { Meta, StoryObj } from "@storybook/react-vite";
import React, { useState } from "react";

import { PrimaryButton } from "../Button";
import { ConfirmByTypingModal } from "./index";

const meta = {
  title: "Components/Dialogs/ConfirmByTypingModal",
  component: ConfirmByTypingModal,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof ConfirmByTypingModal>;

export default meta;
type Story = StoryObj<typeof meta>;

function InteractiveStory(args: ConfirmByTypingModal.Props) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="p-4">
      <PrimaryButton onClick={() => setIsOpen(true)}>Open modal</PrimaryButton>
      <ConfirmByTypingModal
        {...args}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={async () => {
          console.log("Confirmed");
          setIsOpen(false);
        }}
      />
    </div>
  );
}

const defaultArgs = {
  isOpen: true,
  onClose: () => {},
  onConfirm: async () => {},
  title: "Delete Company",
  confirmationValue: "Acme Corp",
  warningMessage: "This action cannot be undone.",
  warningDescription: (
    <>
      This will permanently delete <strong>Acme Corp</strong> and its spaces, goals, projects, and other resources.
    </>
  ),
  confirmLabel: "Delete Company",
  loadingLabel: "Deleting...",
  inputTestId: "confirm-delete-input",
  confirmTestId: "confirm-delete-button",
};

export const Default: Story = {
  args: defaultArgs,
  render: (args) => <InteractiveStory {...args} />,
};

export const Loading: Story = {
  args: defaultArgs,
  render: (args) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className="p-4">
        <PrimaryButton onClick={() => setIsOpen(true)}>Open modal</PrimaryButton>
        <ConfirmByTypingModal
          {...args}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onConfirm={async () => {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            setIsOpen(false);
          }}
        />
      </div>
    );
  },
};

export const DisabledUntilTyped: Story = {
  args: {
    ...defaultArgs,
    confirmationValue: "DELETE",
    warningMessage: "Type DELETE to continue.",
    warningDescription: "The confirm button stays disabled until the text matches exactly.",
    confirmLabel: "Confirm deletion",
  },
  render: (args) => <InteractiveStory {...args} />,
};
