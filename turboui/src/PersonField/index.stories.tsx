import type { Meta, StoryObj } from "@storybook/react";
import { IconUserCheck } from "../icons";
import React from "react";
import { Page } from "../Page";
import { genPeople, genPerson } from "../utils/storybook/genPeople";
import { PersonField } from "./index";
import { usePersonFieldSearch } from "../utils/storybook/usePersonFieldSearch";

/**
 * PersonField is a component for displaying and selecting a person within a popover interface.
 * Key features:
 * - Displays person avatar, name, and title when assigned
 * - Shows placeholder state with question mark icon when no person is assigned
 * - Supports different avatar sizes
 * - Can show or hide person title
 * - Supports readonly mode to disable interactions
 * - Uses Radix UI Popover for potential future selection functionality
 */
const meta: Meta<typeof PersonField> = {
  title: "Components/Fields/PersonField",
  component: PersonField,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    person: { control: "object" },
    avatarSize: { control: "number" },
    size: { control: { type: "select" }, options: ["small", "normal"] },
    readonly: { control: "boolean" },
    showTitle: { control: "boolean" },
  },
} satisfies Meta<typeof PersonField>;

export default meta;
type Story = StoryObj<typeof meta>;

const person = genPerson();
const potentialPeople = genPeople(10);

const Component = (args: Partial<PersonField.Props>) => {
  const [person, setPerson] = React.useState<PersonField.Props["person"]>(args.person || null);
  const searchData = usePersonFieldSearch(potentialPeople);

  if (args.readonly === true) {
    return <PersonField {...args} person={person} setPerson={setPerson} readonly={true} />;
  }

  return <PersonField {...args} person={person} setPerson={setPerson} searchData={searchData} />;
};

export const AllStates: Story = {
  render: () => {
    return (
      <Page title="PersonField All States" size="medium">
        <div className="grid grid-cols-2 gap-8 p-12">
          <div>
            <div className="font-bold text-content-dimmed mb-6 pb-2">Editable</div>
            <div className="space-y-8">
              <div>
                <Label>Default</Label>
                <Component person={person} />
              </div>

              <div>
                <Label>Empty State</Label>
                <Component person={null} />
              </div>

              <div>
                <Label>Empty State Custom Message</Label>
                <Component person={null} emptyStateMessage="Set champion" />
              </div>

              <div>
                <Label>Compact (size="small")</Label>
                <Component person={person} size="small" showTitle={false} />
              </div>

              <div>
                <Label>Dialog Open</Label>
                <Component
                  person={person}
                  emptyStateMessage="Set champion"
                  isOpen
                  extraDialogMenuOptions={[
                    {
                      label: "Assign as reviewer",
                      onClick: () => alert("Custom option clicked"),
                      icon: IconUserCheck,
                    },
                  ]}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="font-bold text-content-dimmed mb-6 pb-2">Read Only</div>

            <div className="space-y-8">
              <div>
                <Label>Default</Label>
                <Component person={person} readonly />
              </div>

              <div>
                <Label>Empty State</Label>
                <Component person={null} readonly emptyStateMessage="Select champion" />
              </div>

              <div>
                <Label>Empty State Custom Message</Label>
                <Component person={null} readonly emptyStateReadOnlyMessage="No champion" />
              </div>
            </div>
          </div>
        </div>
      </Page>
    );
  },
};

const Label = ({ children }) => <div className="font-bold text-xs text-content-dimmed mb-3">{children}</div>;

export const AvatarOnlyMode: Story = {
  render: () => {
    return (
      <Page title="PersonField - Avatar Only Mode">
        <div className="space-y-8 p-8">
          <div>
            <Label>Avatar Only - Different Sizes</Label>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="mb-2 text-sm">Small (20px)</div>
                <Component avatarOnly={true} avatarSize={20} />
              </div>
              <div className="text-center">
                <div className="mb-2 text-sm">Default (24px)</div>
                <Component avatarOnly={true} avatarSize={24} />
              </div>
              <div className="text-center">
                <div className="mb-2 text-sm">Medium (32px)</div>
                <Component avatarOnly={true} avatarSize={32} />
              </div>
              <div className="text-center">
                <div className="mb-2 text-sm">Large (40px)</div>
                <Component avatarOnly={true} avatarSize={40} />
              </div>
            </div>
          </div>

          <div>
            <Label>Avatar Only - With Assigned Person</Label>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="mb-2 text-sm">With Avatar</div>
                <Component person={person} avatarOnly={true} avatarSize={32} />
              </div>
              <div className="text-center">
                <div className="mb-2 text-sm">No Avatar</div>
                <Component person={{ ...person, avatarUrl: null }} avatarOnly={true} avatarSize={32} />
              </div>
              <div className="text-center">
                <div className="mb-2 text-sm">Read-only</div>
                <Component person={person} avatarOnly={true} avatarSize={32} readonly={true} />
              </div>
            </div>
          </div>

          <div>
            <Label>Avatar Only - Task Item Context</Label>
            <div className="flex items-center gap-2 p-4 bg-surface-base border rounded">
              <span className="text-sm">Task assignee:</span>
              <Component avatarOnly={true} avatarSize={24} />
              <span className="text-sm text-content-subtle">← Click to assign</span>
            </div>
          </div>
        </div>
      </Page>
    );
  },
};
