import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { CompanyAdminManagePeoplePage } from ".";
import { genPeople } from "../utils/storybook/genPeople";

const meta = {
  title: "Pages/CompanyAdminManagePeoplePage",
  component: CompanyAdminManagePeoplePage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof CompanyAdminManagePeoplePage>;

export default meta;
type Story = StoryObj<typeof meta>;

const navigationItems = [
  { label: "Company Administration", to: "/admin" },
  { label: "Manage Team Members", to: "/admin/people" },
];

const inviteLink = "https://app.operately.com/join?token=demo-invite-token";

const examplePeople = genPeople(10);

function buildPerson(index: number, overrides: Partial<CompanyAdminManagePeoplePage.Person>): CompanyAdminManagePeoplePage.Person {
  const basePerson = examplePeople[index % examplePeople.length]!;
  return {
    id: basePerson.id,
    fullName: basePerson.fullName,
    title: basePerson.title,
    email: `${basePerson.id}@example.com`,
    avatarUrl: basePerson.avatarUrl,
    hasOpenInvitation: false,
    hasValidInvite: false,
    invitationExpired: false,
    expiresIn: null,
    profilePath: `/people/${basePerson.id}`,
    profileEditPath: `/people/${basePerson.id}/edit`,
    inviteLinkUrl: null,
    canRemove: true,
    accessLevel: 70, // EDIT_ACCESS
    ...overrides,
  };
}

const invitedPeople = [
  buildPerson(0, {
    hasOpenInvitation: true,
    hasValidInvite: true,
    expiresIn: "2 days",
    inviteLinkUrl: inviteLink,
  }),
];

const currentMembers = [
  buildPerson(1, {}),
  buildPerson(2, { accessLevel: 100 }), // FULL_ACCESS
  buildPerson(3, { accessLevel: 40 }), // COMMENT_ACCESS
  buildPerson(4, {}),
];

const outsideCollaborators = [
  buildPerson(5, { accessLevel: 10 }), // VIEW_ACCESS
  buildPerson(6, {}),
];

function StoryWrapper({ args }: { args: CompanyAdminManagePeoplePage.Props }) {
  const [people, setPeople] = React.useState({
    invited: args.invitedPeople,
    members: args.currentMembers,
    collaborators: args.outsideCollaborators || [],
  });

  const handleChangeAccessLevel = async (personId: string, accessLevel: number) => {
    setPeople((prev) => ({
      ...prev,
      members: prev.members.map((p) => (p.id === personId ? { ...p, accessLevel } : p)),
      collaborators: prev.collaborators.map((p) => (p.id === personId ? { ...p, accessLevel } : p)),
    }));
    console.log(`Changed access level for person ${personId} to ${accessLevel}`);
  };

  return (
    <CompanyAdminManagePeoplePage
      {...args}
      currentMembers={people.members}
      outsideCollaborators={people.collaborators}
      onChangeAccessLevel={handleChangeAccessLevel}
    />
  );
}

const baseProps = {
  companyName: "Operately",
  navigationItems,
  addMemberPath: "/admin/people/new",
  invitedPeople,
  currentMembers,
  onRemovePerson: async () => {},
  onConvertToGuest: async () => {},
  onReissueInvitation: async () => inviteLink,
  onRenewInvitation: async () => inviteLink,
  onChangeAccessLevel: async (personId: string, accessLevel: number) => {
    console.log(`Changed access level for person ${personId} to ${accessLevel}`);
  },
  permissions: {
    canEditTrustedEmailDomains: true,
    canInviteMembers: true,
    canRemoveMembers: true,
    canCreateSpace: true,
    canManageAdmins: true,
    canManageOwners: true,
    canEditMembersAccessLevels: true,
  },
};

export const Default: Story = {
  args: baseProps,
  render: (args) => <StoryWrapper args={args} />,
};

export const WithOutsideCollaborators: Story = {
  args: {
    ...baseProps,
    outsideCollaborators,
    showOutsideCollaborators: true,
  },
  render: (args) => <StoryWrapper args={args} />,
};
