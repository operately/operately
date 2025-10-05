import { Meta, StoryObj } from "@storybook/react-vite";
import React, { useState } from "react";
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

function Component(props: Partial<TextField.Props>) {
  const [value1, setValue1] = useState(props.text || "");
  return <TextField text={value1} onChange={setValue1} {...props} />;
}

export const Default: StoryObj<typeof TextField> = {
  render: () => {
    return (
      <div className="space-y-8">
        <h2 className="mb-4 font-bold text-xl">Inline Variants</h2>

        <div>
          <div className="uppercase text-xs mb-2">Example 1: Default</div>
          <Component className="" placeholder="Enter project name" />
        </div>

        <div>
          <div className="uppercase text-xs mb-2">Example 2: Custom Class</div>
          <Component className="font-bold text-xl" placeholder="Enter project name" />
        </div>

        <div>
          <div className="uppercase text-xs mb-2">Example 3: Read Only</div>
          <Component readonly placeholder="This is read-only" />
        </div>

        <div>
          <div className="uppercase text-xs mb-2">Example 4: Placeholder</div>
          <Component placeholder="This is a placeholder" />
        </div>

        <h2 className="mt-8 mb-4 font-bold text-xl">Form Field Variants</h2>

        <div>
          <div className="uppercase text-xs mb-2 mt-8">Form-Field Variant: Editable</div>
          <Component variant="form-field" placeholder="Enter text" />
        </div>

        <div>
          <div className="uppercase text-xs mb-2">Form-Field Variant: Custiom Placeholder</div>
          <Component variant="form-field" placeholder="Form field placeholder" />
        </div>

        <div>
          <Component variant="form-field" label="With Label" />
        </div>

        <div>
          <Component
            variant="form-field"
            label="With Label and Error"
            error="You mean Hello World, right?"
            text="Hello"
          />
        </div>
      </div>
    );
  },
};
