import { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Page } from "../Page";
import { TextField } from "./index";

export default {
  title: "Components/Fields/TextField",
  component: TextField,
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
} as Meta<typeof TextField>;

export const Default: StoryObj<typeof TextField> = {
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
          <TextField text="Project Alpha" onSave={onSave} className="" placeholder="Enter project name" />
        </div>

        <div>
          <div className="uppercase text-xs mb-2">Example 2: Custom Class</div>
          <TextField
            text="Project Beta"
            onSave={onSave}
            className="font-bold text-xl"
            placeholder="Enter project name"
          />
        </div>

        <div>
          <div className="uppercase text-xs mb-2">Example 3: Read Only</div>
          <TextField text="Project Gamma" onSave={onSave} readonly placeholder="This is read-only" />
        </div>

        <div>
          <div className="uppercase text-xs mb-2">Example 4: Placeholder</div>
          <TextField text="" onSave={onSave} placeholder="This is a placeholder" />
        </div>

        <div>
          <div className="uppercase text-xs mb-2 mt-8">Form-Field Variant: Editable</div>
          <TextField text="Form Field Text" onSave={onSave} variant="form-field" placeholder="Enter text" />
        </div>

        <div>
          <div className="uppercase text-xs mb-2">Form-Field Variant: Placeholder</div>
          <TextField text="" onSave={onSave} variant="form-field" placeholder="Form field placeholder" />
        </div>
      </div>
    );
  },
};
