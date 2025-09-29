import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { CompanySetupPage } from "./index";

// We'll create a wrapper to show individual setup items
function SetupItemWrapper({ setupItem }: { setupItem: CompanySetupPage.SetupItem }) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <CompanySetupPage
        title="Setup Item Demo"
        subtitle="Individual setup item component showcase"
        setupItems={[setupItem]}
      />
    </div>
  );
}

const meta: Meta<typeof SetupItemWrapper> = {
  title: "Pages/CompanySetupPage/SetupItem",
  component: SetupItemWrapper,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    setupItem: {
      control: "object",
      description: "Individual setup item configuration",
    },
  },
};

export default meta;
type Story = StoryObj<typeof SetupItemWrapper>;

export const IncompleteItem: Story = {
  args: {
    setupItem: {
      id: "sample-incomplete",
      title: "Sample Setup Task",
      description: "This is an example of an incomplete setup item with a clear call to action.",
      linkTo: "/example",
      linkText: "Get started",
      isCompleted: false,
      testId: "setup-sample",
    },
  },
};

export const CompletedItem: Story = {
  args: {
    setupItem: {
      id: "sample-complete",
      title: "Sample Completed Task",
      description: "This setup item has been completed successfully and shows the checkmark.",
      linkTo: "/example",
      linkText: "Get started",
      isCompleted: true,
      testId: "setup-sample-complete",
    },
  },
};

export const LongTitle: Story = {
  args: {
    setupItem: {
      id: "long-title",
      title: "This is a very long setup item title that might wrap to multiple lines depending on the screen size",
      description: "Short description for contrast.",
      linkTo: "/example",
      linkText: "Continue",
      isCompleted: false,
      testId: "setup-long-title",
    },
  },
};

export const LongDescription: Story = {
  args: {
    setupItem: {
      id: "long-description",
      title: "Setup with detailed explanation",
      description:
        "This is a much longer description that provides comprehensive details about what this setup step involves, why it's important for your organization, and what you can expect to accomplish once you complete this particular setup task. It might span multiple lines and should remain readable and well-formatted.",
      linkTo: "/example",
      linkText: "Learn more",
      isCompleted: false,
      testId: "setup-long-description",
    },
  },
};

export const LongButtonText: Story = {
  args: {
    setupItem: {
      id: "long-button",
      title: "Task with verbose action",
      description: "This setup item has a longer call-to-action button text.",
      linkTo: "/example",
      linkText: "Go to configuration page",
      isCompleted: false,
      testId: "setup-long-button",
    },
  },
};

export const MinimalContent: Story = {
  args: {
    setupItem: {
      id: "minimal",
      title: "Quick task",
      description: "Brief description.",
      linkTo: "/go",
      linkText: "Go",
      isCompleted: false,
      testId: "setup-minimal",
    },
  },
};

// Test states for interactive behavior
export const InteractiveStates: Story = {
  args: {
    setupItem: {
      id: "interactive",
      title: "Hover and focus test",
      description: "Use this item to test hover and focus states on the button.",
      linkTo: "/example",
      linkText: "Try hovering",
      isCompleted: false,
      testId: "setup-interactive",
    },
  },
  parameters: {
    docs: {
      description: {
        story: "This story is useful for testing hover and focus states on the action button.",
      },
    },
  },
};
