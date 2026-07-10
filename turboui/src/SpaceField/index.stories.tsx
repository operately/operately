import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { Page } from "../Page";
import { SpaceField } from "./index";

/**
 * SpaceField is a component for displaying and selecting a space within a popover interface.
 * Key features:
 * - Displays space icon and name when a space is assigned
 * - Shows placeholder state when no space is selected
 * - Supports different icon sizes and variants (inline/form-field)
 * - Includes search functionality for spaces
 * - Supports readonly mode to disable interactions
 * - Uses Radix UI Popover for selection functionality
 */
const meta = {
  title: "Components/Fields/SpaceField",
  component: SpaceField,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    space: { control: "object" },
    iconSize: { control: "number" },
    readonly: { control: "boolean" },
    variant: {
      control: "select",
      options: ["inline", "form-field"],
    },
  },
} satisfies Meta<typeof SpaceField>;

export default meta;
type Story = StoryObj<typeof meta>;

const space = { id: "1", name: "Product Development", link: "#" };
const spaces = [
  { id: "1", name: "Product Development", link: "#" },
  { id: "2", name: "Marketing", link: "#" },
  { id: "3", name: "Engineering", link: "#" },
  { id: "4", name: "Sales", link: "#" },
  { id: "5", name: "Human Resources", link: "#" },
];

const search = async ({ query }: { query: string }) => {
  if (!query) return spaces;
  return spaces.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()));
};

const setSpaceFn = (space: SpaceField.Space | null) => {
  console.log("Setting space:", space);
};

const ComponentWrapper = (args: Partial<SpaceField.Props>) => {
  const [space, setSpace] = React.useState<SpaceField.Space | null>(args.space || null);
  return <SpaceField {...args} space={space} setSpace={setSpace} search={search} />;
};

const Label = ({ children }: { children: React.ReactNode }) => <div className="text-sm font-bold mb-2">{children}</div>;

/**
 * Demonstrates all possible states of the SpaceField component
 */
export const AllStates: Story = {
  parameters: {
    docs: {
      story: { inline: true },
    },
  },
  args: {
    space,
    setSpace: setSpaceFn,
    search,
  },
  render: () => {
    return (
      <Page title="SpaceField All States" size="medium">
        <div className="space-y-12 p-12">
          <div>
            <h2 className="text-lg font-bold mb-8">Inline Variant (Default)</h2>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <Label>Normal</Label>
                <ComponentWrapper space={space} variant="inline" />
              </div>

              <div>
                <Label>Empty</Label>
                <ComponentWrapper space={null} variant="inline" />
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base pt-12">
            <h2 className="text-lg font-bold mb-8">Form-Field Variant</h2>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <Label>Normal</Label>
                <ComponentWrapper space={space} variant="form-field" />
              </div>

              <div>
                <Label>Empty</Label>
                <ComponentWrapper space={null} variant="form-field" />
              </div>

              <div>
                <ComponentWrapper space={null} variant="form-field" label="With Label" />
              </div>

              <div>
                <ComponentWrapper
                  space={null}
                  variant="form-field"
                  label="With Label and Error"
                  error="This is an error"
                />
              </div>
            </div>
          </div>
        </div>
      </Page>
    );
  },
};
