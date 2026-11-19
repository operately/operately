import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useTranslation } from "react-i18next";

import { FieldGroup, Form, SelectBox, SelectPerson, Submit, useForm } from "./index";

const spaces = [
  { value: "research", label: "International Customer Research and Development — Europe" },
  { value: "operations", label: "International Customer Research and Development — Americas" },
  { value: "unbroken", label: "InternationalCustomerResearchAndDevelopmentOperations" },
  { value: "short", label: "Design" },
];
const people = [
  { id: "alexandra", fullName: "Alexandra Catherine Montgomery Richardson", avatarUrl: null },
  { id: "alexander", fullName: "Alexandra Catherine Montgomery Robertson", avatarUrl: null },
  { id: "unbroken", fullName: "AlexandraCatherineMontgomeryRichardson", avatarUrl: null },
  { id: "short", fullName: "Sam Lee", avatarUrl: null },
];
const searchPeople = async (query: string) =>
  people.filter((person) => person.fullName.toLowerCase().includes(query.toLowerCase()));

const meta: Meta = {
  title: "Components/Forms/Project Pickers",
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-2xl p-6">
        <Story />
      </div>
    ),
  ],
};
export default meta;

export const LongNames: StoryObj = {
  render: () => <ProjectPickers />,
};

function ProjectPickers() {
  const { t } = useTranslation();
  const form = useForm({
    fields: { space: "research", champion: "", reviewer: "" },
    submit: async () => console.log("Selected:", form.values),
  });

  return (
    <Form form={form} testId="project-pickers">
      <FieldGroup>
        <SelectBox field="space" label={t("Space")} options={spaces} required />
        <FieldGroup
          layout="grid"
          layoutOptions={{ columns: 2, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 16rem), 1fr))" }}
        >
          <SelectPerson field="champion" label={t("Champion")} searchFn={searchPeople} default={people[0]} />
          <SelectPerson
            field="reviewer"
            label={t("Reviewer")}
            searchFn={searchPeople}
            default={people[1]}
            allowEmpty
            emptyLabel={t("No reviewer")}
            required={false}
          />
        </FieldGroup>
      </FieldGroup>
      <Submit saveText={t("Add Project")} />
    </Form>
  );
}
