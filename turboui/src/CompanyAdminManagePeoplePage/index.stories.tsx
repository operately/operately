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
  buildPerson(2, {}),
];

const outsideCollaborators = [
  buildPerson(3, {}),
];

const baseProps = {
  companyName: "Operately",
  navigationItems,
  addMemberPath: "/admin/people/new",
  invitedPeople,
  currentMembers,
  onRemovePerson: async () => {},
  onReissueInvitation: async () => inviteLink,
  onRenewInvitation: async () => inviteLink,
};

export const Default: Story = {
  args: baseProps,
};

export const WithOutsideCollaborators: Story = {
  args: {
    ...baseProps,
    outsideCollaborators,
    showOutsideCollaborators: true,
  },
};
