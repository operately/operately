import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useTranslation } from "react-i18next";
import { expect, userEvent, within } from "storybook/test";

import * as Forms from "../Forms";
import { SpaceMemberFields } from ".";

interface Member {
  key: number;
  personId: string;
  accessLevel: number;
}

const people = [
  { id: "alexandra", fullName: "Alexandra Catherine Montgomery Richardson", avatarUrl: null },
  { id: "boby", fullName: "Boby Brown", avatarUrl: null },
  { id: "cathy", fullName: "Cathy Clarkson", avatarUrl: null },
];

const searchPeople = async (query: string) =>
  people.filter((person) => person.fullName.toLowerCase().includes(query.toLowerCase()));

const meta: Meta = {
  title: "Components/Space Member Fields",
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-2xl p-5 sm:p-0 sm:mt-10">
        <Story />
      </div>
    ),
  ],
};

export default meta;

export const OneMember: StoryObj = { render: () => <MemberForm initialCount={1} /> };
export const ThreeMembers: StoryObj = { render: () => <MemberForm initialCount={3} /> };
export const ThreeMembersDark: StoryObj = {
  render: () => (
    <div className="dark bg-surface-base p-5">
      <MemberForm initialCount={3} />
    </div>
  ),
};
export const AddAndRemove: StoryObj = {
  render: () => <MemberForm initialCount={1} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Add another member" }));
    await expect(canvasElement.querySelectorAll('[data-test-id^="member-"]')).toHaveLength(2);
    await userEvent.click(canvas.getByRole("button", { name: "Remove member" }));
    await expect(canvasElement.querySelectorAll('[data-test-id^="member-"]')).toHaveLength(1);
  },
};

function MemberForm({ initialCount }: { initialCount: number }) {
  const form = Forms.useForm({
    fields: { members: Array.from({ length: initialCount }, (_, index) => newMember(index + 1)) },
    submit: async () => console.log("Selected members:", form.values.members),
  });

  return (
    <Forms.Form form={form}>
      <MemberFields />
      <Forms.Submit />
    </Forms.Form>
  );
}

function MemberFields() {
  const { t } = useTranslation();
  const [members = [], setMembers] = Forms.useFieldValue<Member[]>("members");
  const nextKey = React.useRef(members.length + 1);

  return (
    <SpaceMemberFields
      members={members}
      searchPeople={searchPeople}
      accessOptions={[
        { value: 100, label: t("Full Access") },
        { value: 70, label: t("Edit Access") },
        { value: 40, label: t("Comment Access") },
        { value: 10, label: t("View Access") },
      ]}
      labels={{
        member: t("Member"),
        accessLevel: t("Access Level"),
        addAnother: t("Add another member"),
        remove: t("Remove member"),
      }}
      onAdd={() => setMembers([...members, newMember(nextKey.current++)])}
      onRemove={(index) => setMembers(members.filter((_, memberIndex) => memberIndex !== index))}
    />
  );
}

function newMember(key: number): Member {
  return { key, personId: "", accessLevel: 70 };
}
