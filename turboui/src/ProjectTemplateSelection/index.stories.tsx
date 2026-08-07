import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import * as Forms from "../Forms";
import { ProjectTemplateSelection } from ".";

const templates = [
  {
    id: "campaign",
    name: "Campaign launch",
    spaceId: "marketing",
    inactivePeopleSummary: { personCount: 1, roleCount: 1, taskCount: 3 },
  },
  { id: "event", name: "Customer event", spaceId: "marketing" },
  { id: "release", name: "Product release", spaceId: "product" },
];

function Story({ template = "", startDate = "" }: { template?: string; startDate?: string }) {
  const form = Forms.useForm({
    fields: { template, startDate },
    submit: async () => undefined,
  });

  return (
    <div className="mx-auto max-w-lg p-8">
      <Forms.Form form={form}>
        <Forms.FieldGroup>
          <ProjectTemplateSelection spaceId="marketing" templates={templates} />
        </Forms.FieldGroup>
        <Forms.Submit saveText="Create project" />
      </Forms.Form>
    </div>
  );
}

const meta: Meta = {
  title: "Forms/ProjectTemplateSelection",
};

export default meta;
type StoryType = StoryObj;

export const NoTemplate: StoryType = { render: () => <Story /> };
export const TemplateSelected: StoryType = {
  render: () => <Story template="campaign" />,
};
export const WithStartDate: StoryType = {
  render: () => <Story template="campaign" startDate="2028-01-10" />,
};
