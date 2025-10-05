import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { InfoCallout, WarningCallout, ErrorCallout, SuccessCallout } from "./index";
import { Link } from "../Link"; // Assuming Link component exists for examples
import { Page } from "../Page";

const meta: Meta<typeof InfoCallout> = {
  title: "Components/Callouts",
  component: InfoCallout, // Default component for controls
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    message: { control: "text" },
    description: { control: "text" },
  },
  decorators: [
    (Story) => (
      <div className="sm:mt-12">
        <Page size="medium" title={"Callout Examples"}>
          <div className="p-12">
            <Story />
          </div>
        </Page>
      </div>
    ),
  ],
};

export default meta;

// --- Info Callout Stories ---

export const Info: StoryObj<typeof InfoCallout> = {
  args: {
    message: "This is an informational message.",
  },
  render: (args) => <InfoCallout {...args} />,
};

export const InfoWithDescription: StoryObj<typeof InfoCallout> = {
  args: {
    message: "Info Callout Title",
    description: "This is a longer description providing more context about the information.",
  },
  render: (args) => <InfoCallout {...args} />,
};

export const InfoWithLink: StoryObj<typeof InfoCallout> = {
  args: {
    message: (
      <>
        Want markup in your info callout? <Link to="#">Add a Reviewer</Link> to get feedback.
      </>
    ),
  },
  render: (args) => <InfoCallout {...args} />,
};

// --- Warning Callout Stories ---

export const Warning: StoryObj<typeof WarningCallout> = {
  args: {
    message: "This is a warning message.",
  },
  render: (args) => <WarningCallout {...args} />,
};

export const WarningWithDescription: StoryObj<typeof WarningCallout> = {
  args: {
    message: "Warning Callout Title",
    description: "This is a longer description providing more context about the warning.",
  },
  render: (args) => <WarningCallout {...args} />,
};

export const WarningWithLink: StoryObj<typeof WarningCallout> = {
  args: {
    message: (
      <>
        This is a warning callout <Link to="#">with a link</Link>.
      </>
    ),
  },
  render: (args) => <WarningCallout {...args} />,
};

// --- Error Callout Stories ---

export const Error: StoryObj<typeof ErrorCallout> = {
  args: {
    message: "This is an error message.",
  },
  render: (args) => <ErrorCallout {...args} />,
};

export const ErrorWithDescription: StoryObj<typeof ErrorCallout> = {
  args: {
    message: "Error Callout Title",
    description: "This is a longer description providing more context about the error.",
  },
  render: (args) => <ErrorCallout {...args} />,
};

export const ErrorWithList: StoryObj<typeof ErrorCallout> = {
  args: {
    message: "Password Requirements Not Met",
    description: (
      <ul className="list-disc pl-5 space-y-1 mt-1">
        <li>Your password must be at least 8 characters</li>
        <li>Your password must include at least one special character</li>
      </ul>
    ),
  },
  render: (args) => <ErrorCallout {...args} />,
};

// --- Success Callout Stories ---

export const Success: StoryObj<typeof SuccessCallout> = {
  args: {
    message: "This is a success message.",
  },
  render: (args) => <SuccessCallout {...args} />,
};

export const SuccessWithDescription: StoryObj<typeof SuccessCallout> = {
  args: {
    message: "Success Callout Title",
    description: "This is a longer description providing more context about the success.",
  },
  render: (args) => <SuccessCallout {...args} />,
};
