import type { Meta, StoryObj } from "@storybook/react";
import { IconUserCheck } from "@tabler/icons-react";
import React from "react";
import { Page } from "../Page";
import { genPeople, genPerson } from "../utils/storybook/genPeople";
import { PersonField } from "./index";

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
    readonly: { control: "boolean" },
    showTitle: { control: "boolean" },
  },
} satisfies Meta<typeof PersonField>;

export default meta;
type Story = StoryObj<typeof meta>;

const person = {
  ...genPerson(),
  profileLink: `#`,
};

const potentialPeople = genPeople(10).map((p) => ({
  ...p,
  profileLink: `#`,
}));

const searchPeople = async (query: string) => {
  if (!query) {
    return potentialPeople;
  }
  return potentialPeople.filter((p) => p.fullName.toLowerCase().includes(query.toLowerCase()));
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
                <PersonField person={person} searchPeople={searchPeople} />
              </div>

              <div>
                <Label>Empty State</Label>
                <PersonField person={null} searchPeople={searchPeople} />
              </div>

              <div>
                <Label>Empty State Custom Message</Label>
                <PersonField person={null} emptyStateMessage="Set champion" searchPeople={searchPeople} />
              </div>

              <div>
                <Label>Dialog Open</Label>
                <PersonField
                  person={person}
                  emptyStateMessage="Set champion"
                  searchPeople={searchPeople}
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
                <PersonField person={person} readonly searchPeople={searchPeople} />
              </div>

              <div>
                <Label>Empty State</Label>
                <PersonField person={null} readonly emptyStateMessage="Select champion" searchPeople={searchPeople} />
              </div>

              <div>
                <Label>Empty State Custom Message</Label>
                <PersonField
                  person={null}
                  readonly
                  emptyStateReadOnlyMessage="No champion"
                  searchPeople={searchPeople}
                />
              </div>
            </div>
          </div>
        </div>
      </Page>
    );
  },
};

const Label = ({ children }) => <div className="font-bold text-xs text-content-dimmed mb-3">{children}</div>;
