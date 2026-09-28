import type { Meta, StoryObj } from "@storybook/react-vite";
import React, { useState } from "react";
import { MilestoneCreationModal } from "../components/MilestoneCreationModal";
import * as Types from "../types";
import { PrimaryButton } from "../../Button";
import { createInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { expect, userEvent, within } from "storybook/test";
import { i18nOptions } from "../../i18nOptions";

/**
 * MilestoneCreationModal is a dialog for creating new milestones in the TaskBoard component.
 */
const meta: Meta<typeof MilestoneCreationModal> = {
  title: "Components/TaskBoard/MilestoneCreationModal",
  component: MilestoneCreationModal,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof MilestoneCreationModal>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Interactive example of the MilestoneCreationModal.
 */
export const Default: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [createdMilestones, setCreatedMilestones] = useState<Types.Milestone[]>([]);

    const handleCreateMilestone = (newMilestoneData: Types.NewMilestonePayload) => {
      // Generate a fake UUID for the new milestone
      const milestoneId = `milestone-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Create the new milestone object
      const newMilestone: Types.Milestone = {
        id: milestoneId,
        ...newMilestoneData,
      };

      console.log("=== Created new milestone ===\n", JSON.stringify(newMilestone, null, 2));

      // Add the new milestone to the list
      setCreatedMilestones((prev) => [...prev, newMilestone]);
    };

    return (
      <div className="space-y-6">
        <div>
          <PrimaryButton onClick={() => setIsOpen(true)}>Open Milestone Creation Modal</PrimaryButton>
          <MilestoneCreationModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            onCreateMilestone={handleCreateMilestone}
          />
        </div>

        {createdMilestones.length > 0 && (
          <div className="mt-8 p-4 border border-surface-outline rounded-md">
            <h3 className="text-lg font-semibold mb-2">Created Milestones</h3>
            <ul className="space-y-2">
              {createdMilestones.map((milestone) => (
                <li key={milestone.id} className="p-2 bg-surface-dimmed rounded-md">
                  <div className="font-medium">{milestone.name}</div>
                  {milestone.dueDate?.date && (
                    <div className="text-sm text-content-subtle">
                      Due: {milestone.dueDate.date.toLocaleDateString()}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  },
};

/**
 * Modal shown in its open state by default.
 */
export const OpenByDefault: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    const handleCreateMilestone = (newMilestoneData: Types.NewMilestonePayload) => {
      console.log("Milestone created:", newMilestoneData);
      // Close modal after creation in this example
      setIsOpen(false);
    };

    return (
      <div>
        <PrimaryButton onClick={() => setIsOpen(true)}>Reopen Modal</PrimaryButton>
        <MilestoneCreationModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onCreateMilestone={handleCreateMilestone}
        />
      </div>
    );
  },
};

const expandedCatalog = createInstance();
void expandedCatalog.init({
  ...i18nOptions,
  initImmediate: false,
  resources: {
    en: {
      translation: {
        "Create Milestone": "Create a new milestone for the project",
        "Milestone name": "Name of the new project milestone",
        "Enter milestone name": "Enter a descriptive name for this milestone",
        "Create more": "Continue creating milestones",
        "Create milestone": "Create this new project milestone",
        Cancel: "Cancel milestone creation",
        Close: "Close the milestone creation dialog",
      },
    },
  },
});

export const ExpandedCatalog: Story = {
  render: () => (
    <I18nextProvider i18n={expandedCatalog}>
      <MilestoneCreationModal isOpen onClose={() => {}} onCreateMilestone={() => {}} />
    </I18nextProvider>
  ),
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const dialog = await page.findByRole("dialog", { name: "Create a new milestone for the project" });
    const controls = within(dialog);
    await expect(controls.getByRole("button", { name: "Close the milestone creation dialog" })).toBeVisible();
    await userEvent.type(
      controls.getByPlaceholderText("Enter a descriptive name for this milestone"),
      "Release readiness",
    );
    await userEvent.tab();
    await expect(controls.getByRole("button", { name: "Create this new project milestone" })).toBeEnabled();
    await expect(dialog.scrollWidth).toBeLessThanOrEqual(dialog.clientWidth);
  },
};
