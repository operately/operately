import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Page } from "../Page";
import { PrivacyField } from "./index";

/**
 * PrivacyField combines privacy display and privacy selection.
 * - Shows privacy level in a readable format with appropriate icon
 * - Can be configured as read-only or editable
 * - Supports setting a new privacy level or editing an existing one
 * - Provides visual indicators for different privacy levels
 * - Offers two display variants: inline (default) and form-field (with border)
 */
const meta: Meta<typeof PrivacyField> = {
  title: "Components/Fields/PrivacyField",
  component: PrivacyField,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof PrivacyField>;

export default meta;
type Story = StoryObj<typeof meta>;

const Component = (args: Partial<PrivacyField.Props>) => {
  const [accessLevels, setAccessLevels] = React.useState<PrivacyField.AccessLevels>(args.accessLevels!);

  return (
    <PrivacyField
      {...args}
      accessLevels={accessLevels}
      setAccessLevels={setAccessLevels}
      spaceName={args.spaceName ?? "Marketing"}
      resourceType={args.resourceType ?? "goal"}
    />
  );
};

export const AllStates: Story = {
  render: () => {
    return (
      <Page title="PrivacyField All States" size="large">
        <div className="space-y-12 p-12">
          <div>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-2">Privacy</h3>
                <Component accessLevels={{ company: "full", space: "full" }} />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Privacy</h3>
                <Component accessLevels={{ company: "edit", space: "edit" }} />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Privacy</h3>
                <Component accessLevels={{ company: "comment", space: "comment" }} />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Privacy</h3>
                <Component accessLevels={{ company: "view", space: "view" }} />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Privacy</h3>
                <Component accessLevels={{ company: "no_access", space: "no_access" }} />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Privacy</h3>
                <Component accessLevels={{ company: "no_access", space: "full" }} />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Privacy</h3>
                <Component accessLevels={{ company: "no_access", space: "edit" }} />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Privacy</h3>
                <Component accessLevels={{ company: "no_access", space: "comment" }} />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Privacy</h3>
                <Component accessLevels={{ company: "no_access", space: "view" }} />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Privacy</h3>
                <Component accessLevels={{ company: "no_access", space: "no_access" }} />
              </div>
            </div>
          </div>
        </div>
      </Page>
    );
  },
};
