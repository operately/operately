import { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Page } from "../Page";
import EditableText from "./index";

export default {
  title: "Components/EditableText",
  component: EditableText,
  decorators: [
    (Story) => (
      <div className="sm:mt-12">
        <Page title="Editable Text Demo" size="small">
          <div className="p-12">
            <Story />
          </div>
        </Page>
      </div>
    ),
  ],
} as Meta<typeof EditableText>;

export const Default: StoryObj<typeof EditableText> = {
  render: () => {
    const onSave = (newText: string): Promise<boolean> => {
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log("Saved:", newText);
          resolve(true);
        }, 500);
      });
    };

    return (
      <div className="space-y-8">
        <div>
          <div className="uppercase text-xs mb-2">Example 1: Default</div>
          <EditableText text="Project Alpha" onSave={onSave} className="" placeholder="Enter project name" />
        </div>

        <div>
          <div className="uppercase text-xs mb-2">Example 2: Custom Class</div>
          <EditableText
            text="Project Beta"
            onSave={onSave}
            className="font-bold text-xl"
            placeholder="Enter project name"
          />
        </div>

        <div>
          <div className="uppercase text-xs mb-2">Example 3: Read Only</div>
          <EditableText text="Project Gamma" onSave={onSave} readonly placeholder="This is read-only" />
        </div>

        <div>
          <div className="uppercase text-xs mb-2">Example 4: Placeholder</div>
          <EditableText text="" onSave={onSave} placeholder="This is a placeholder" />
        </div>
      </div>
    );
  },
};
