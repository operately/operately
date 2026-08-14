import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";

import { defaultFormattedTimePreferences } from "../FormattedTime";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { SaveProjectAsTemplateModal } from ".";

const meta = {
  title: "Components/SaveProjectAsTemplateModal",
  component: SaveProjectAsTemplateModal,
  args: {
    isOpen: true,
    onClose: () => undefined,
    projectName: "Product launch",
    projectDescription: { type: "doc", content: [] },
    richTextHandlers: createMockRichEditorHandlers(),
    formattedTimePreferences: defaultFormattedTimePreferences,
    submissionEnabled: true,
    onSave: async () => ({ success: true }),
  },
} satisfies Meta<typeof SaveProjectAsTemplateModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ScheduleErrors: Story = {
  args: { submissionEnabled: true },
  render: (args) => (
    <SaveProjectAsTemplateModal
      {...args}
      onSave={async () => ({
        success: false,
        scheduleIssues: [
          {
            resourceType: "milestone",
            resourceId: "release",
            resourceName: "Release",
            field: "due_date",
            date: "2028-01-09",
            reason: "before_project_start",
            link: "/milestones/release",
          },
        ],
      })}
    />
  ),
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "Save as template" }));
  },
};
