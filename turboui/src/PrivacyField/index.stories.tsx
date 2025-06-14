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
  const [privacyLevel, setPrivacyLevel] = React.useState<PrivacyField.PrivacyLevels | null>(args.privacyLevel || null);
  return <PrivacyField {...args} privacyLevel={privacyLevel} setPrivacyLevel={setPrivacyLevel} />;
};

export const AllStates: Story = {
  render: () => {
    return (
      <Page title="PrivacyField All States" size="medium">
        <div className="space-y-12 p-12">
          <div>
            <h2 className="text-lg font-bold mb-8">Inline Variant (Default)</h2>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-2">Public</h3>
                <Component privacyLevel="public" spaceName="Marketing" resourceType="project" variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Internal</h3>
                <Component privacyLevel="internal" spaceName="Marketing" resourceType="project" variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Confidential</h3>
                <Component privacyLevel="confidential" spaceName="Marketing" resourceType="project" variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Secret</h3>
                <Component privacyLevel="secret" spaceName="Marketing" resourceType="project" variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Read-Only Public</h3>
                <Component
                  privacyLevel="public"
                  spaceName="Marketing"
                  resourceType="project"
                  readonly
                  variant="inline"
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Read-Only Secret</h3>
                <Component
                  privacyLevel="secret"
                  spaceName="Marketing"
                  resourceType="project"
                  readonly
                  variant="inline"
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Empty</h3>
                <Component privacyLevel={null} spaceName="Marketing" resourceType="project" variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Empty + Read-Only</h3>
                <Component privacyLevel={null} spaceName="Marketing" resourceType="project" readonly variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Empty + As Button</h3>
                <Component
                  privacyLevel={null}
                  spaceName="Marketing"
                  resourceType="project"
                  showEmptyStateAsButton
                  variant="inline"
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Empty + As Button + Read-Only</h3>
                <Component
                  privacyLevel={null}
                  spaceName="Marketing"
                  resourceType="project"
                  showEmptyStateAsButton
                  readonly
                  variant="inline"
                />
                <span className="text-xs text-content-dimmed">(It is invisible)</span>
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base pt-12">
            <h2 className="text-lg font-bold mb-8">Without Icon (Compact Context)</h2>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-2">Public</h3>
                <Component
                  privacyLevel="public"
                  spaceName="Marketing"
                  resourceType="project"
                  showIcon={false}
                  variant="inline"
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Internal</h3>
                <Component
                  privacyLevel="internal"
                  spaceName="Marketing"
                  resourceType="project"
                  showIcon={false}
                  variant="inline"
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Confidential</h3>
                <Component
                  privacyLevel="confidential"
                  spaceName="Marketing"
                  resourceType="project"
                  showIcon={false}
                  variant="inline"
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Secret</h3>
                <Component
                  privacyLevel="secret"
                  spaceName="Marketing"
                  resourceType="project"
                  showIcon={false}
                  variant="inline"
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Empty</h3>
                <Component
                  privacyLevel={null}
                  spaceName="Marketing"
                  resourceType="project"
                  showIcon={false}
                  variant="inline"
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Read-Only + Secret</h3>
                <Component
                  privacyLevel="secret"
                  spaceName="Marketing"
                  resourceType="project"
                  showIcon={false}
                  readonly
                  variant="inline"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base pt-12">
            <h2 className="text-lg font-bold mb-8">Form Field Variant</h2>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-2">Public</h3>
                <Component privacyLevel="public" spaceName="Marketing" resourceType="project" variant="form-field" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Internal</h3>
                <Component privacyLevel="internal" spaceName="Marketing" resourceType="project" variant="form-field" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Confidential</h3>
                <Component
                  privacyLevel="confidential"
                  spaceName="Marketing"
                  resourceType="project"
                  variant="form-field"
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Secret</h3>
                <Component privacyLevel="secret" spaceName="Marketing" resourceType="project" variant="form-field" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Empty</h3>
                <Component privacyLevel={null} spaceName="Marketing" resourceType="project" variant="form-field" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Read-Only</h3>
                <Component
                  privacyLevel="confidential"
                  spaceName="Marketing"
                  resourceType="project"
                  readonly
                  variant="form-field"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base pt-12">
            <h2 className="text-lg font-bold mb-8">Different Resource Types</h2>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-2">Goal Privacy</h3>
                <Component privacyLevel="confidential" spaceName="Engineering" resourceType="goal" variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Project Privacy</h3>
                <Component
                  privacyLevel="confidential"
                  spaceName="Engineering"
                  resourceType="project"
                  variant="inline"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base pt-12">
            <h2 className="text-lg font-bold mb-8">Different Space Names</h2>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-2">Marketing Space</h3>
                <Component privacyLevel="confidential" spaceName="Marketing" resourceType="project" variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Engineering Space</h3>
                <Component
                  privacyLevel="confidential"
                  spaceName="Engineering"
                  resourceType="project"
                  variant="inline"
                />
              </div>
            </div>
          </div>
        </div>
      </Page>
    );
  },
};
