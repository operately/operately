import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Page } from "../Page";
import { AccessSelectors, Form, Submit, useForm } from "./index";

const companyOptions = [
  { value: 0, label: "No Access" },
  { value: 40, label: "Comment Access" },
  { value: 100, label: "Full Access" },
];

const spaceOptions = [
  { value: 40, label: "Comment Access" },
  { value: 70, label: "Edit Access" },
  { value: 100, label: "Full Access" },
];

const meta: Meta = {
  title: "Components/Forms/AccessSelectors",
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="sm:mt-12">
        <Page size="medium" title="Access Selectors">
          <div className="p-12 max-w-2xl">
            <Story />
          </div>
        </Page>
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj;

export const SpaceAccess: Story = {
  render: () => {
    function Harness() {
      const form = useForm({
        fields: {
          access: {
            anonymous: 0,
            companyMembers: 100,
            companyMembersOptions: companyOptions,
          },
        },
        submit: async () => {
          console.log("Submitted:", form.values);
        },
      });

      return (
        <Form form={form}>
          <AccessSelectors showSpaceAccess={false} />
          <Submit />
        </Form>
      );
    }

    return <Harness />;
  },
};

export const ProjectAccess: Story = {
  render: () => {
    function Harness() {
      const form = useForm({
        fields: {
          access: {
            anonymous: 0,
            companyMembers: 100,
            spaceMembers: 70,
            companyMembersOptions: companyOptions,
            spaceMembersOptions: spaceOptions,
          },
        },
        submit: async () => {
          console.log("Submitted:", form.values);
        },
      });

      return (
        <Form form={form}>
          <AccessSelectors />
          <Submit />
        </Form>
      );
    }

    return <Harness />;
  },
};

export const HiddenCompanySelector: Story = {
  render: () => {
    function Harness() {
      const form = useForm({
        fields: {
          access: {
            anonymous: 0,
            companyMembers: 0,
            spaceMembers: 70,
            companyMembersOptions: [{ value: 0, label: "No Access" }],
            spaceMembersOptions: spaceOptions,
          },
        },
        submit: async () => {
          console.log("Submitted:", form.values);
        },
      });

      return (
        <Form form={form}>
          <AccessSelectors />
          <Submit />
        </Form>
      );
    }

    return <Harness />;
  },
};
