import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Page } from "../Page";
import { AccessSelectors, Form, Submit, useForm } from "./index";

const NO_ACCESS = 0;
const VIEW_ACCESS = 10;
const COMMENT_ACCESS = 40;
const EDIT_ACCESS = 70;
const FULL_ACCESS = 100;

type AccessOption = { value: number; label: string };

const COMPANY_OPTIONS: AccessOption[] = [
  { value: FULL_ACCESS, label: "Full Access" },
  { value: EDIT_ACCESS, label: "Edit Access" },
  { value: COMMENT_ACCESS, label: "Comment Access" },
  { value: VIEW_ACCESS, label: "View Access" },
  { value: NO_ACCESS, label: "No Access" },
];

const SPACE_OPTIONS: AccessOption[] = [
  { value: FULL_ACCESS, label: "Full Access" },
  { value: EDIT_ACCESS, label: "Edit Access" },
  { value: COMMENT_ACCESS, label: "Comment Access" },
  { value: VIEW_ACCESS, label: "View Access" },
  { value: NO_ACCESS, label: "No Access" },
];

type AccessState = {
  anonymous: number;
  companyMembers: number;
  companyMembersOptions: AccessOption[];
  spaceMembers: number;
  spaceMembersOptions: AccessOption[];
};

function clamp(value: number, options: AccessOption[]) {
  if (options.some((option) => option.value === value)) {
    return value;
  }

  return options[0]?.value ?? NO_ACCESS;
}

function applyProjectAccessConstraints(access: AccessState, parentCompanyAccess = FULL_ACCESS): AccessState {
  const spaceMembersOptions = SPACE_OPTIONS.filter((option) => option.value >= access.anonymous);
  const spaceMembers = clamp(access.spaceMembers, spaceMembersOptions);
  const companyMembersOptions = COMPANY_OPTIONS.filter(
    (option) => option.value >= access.anonymous && option.value <= spaceMembers && option.value <= parentCompanyAccess,
  );

  return {
    ...access,
    spaceMembers,
    spaceMembersOptions,
    companyMembers: clamp(access.companyMembers, companyMembersOptions),
    companyMembersOptions,
  };
}

function applySpaceAccessConstraints(access: AccessState): AccessState {
  const companyMembersOptions = COMPANY_OPTIONS.filter((option) => option.value >= access.anonymous);

  return {
    ...access,
    companyMembersOptions,
    companyMembers: clamp(access.companyMembers, companyMembersOptions),
  };
}

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

export const SpaceGeneralAccess: Story = {
  name: "Space general access",
  render: () => {
    function Harness() {
      const form = useForm({
        fields: {
          access: applySpaceAccessConstraints({
            anonymous: NO_ACCESS,
            companyMembers: COMMENT_ACCESS,
            companyMembersOptions: COMPANY_OPTIONS,
            spaceMembers: COMMENT_ACCESS,
            spaceMembersOptions: SPACE_OPTIONS,
          }),
        },
        onChange: ({ newValues }) => {
          newValues.access = applySpaceAccessConstraints(newValues.access);
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

export const ProjectOrGoalAccess: Story = {
  name: "Project / goal access",
  render: () => {
    function Harness() {
      const form = useForm({
        fields: {
          access: applyProjectAccessConstraints({
            anonymous: NO_ACCESS,
            companyMembers: COMMENT_ACCESS,
            companyMembersOptions: COMPANY_OPTIONS,
            spaceMembers: EDIT_ACCESS,
            spaceMembersOptions: SPACE_OPTIONS,
          }),
        },
        onChange: ({ newValues }) => {
          newValues.access = applyProjectAccessConstraints(newValues.access);
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

export const CompanyCappedBySpace: Story = {
  name: "Company capped by space access",
  render: () => {
    function Harness() {
      const form = useForm({
        fields: {
          access: applyProjectAccessConstraints({
            anonymous: NO_ACCESS,
            companyMembers: VIEW_ACCESS,
            companyMembersOptions: COMPANY_OPTIONS,
            spaceMembers: VIEW_ACCESS,
            spaceMembersOptions: SPACE_OPTIONS,
          }),
        },
        onChange: ({ newValues }) => {
          newValues.access = applyProjectAccessConstraints(newValues.access);
        },
        submit: async () => {
          console.log("Submitted:", form.values);
        },
      });

      return (
        <Form form={form}>
          <p className="text-sm text-content-dimmed mb-2">
            Company options cannot exceed the current space members access. Raise space access to unlock higher company
            levels.
          </p>
          <AccessSelectors />
          <Submit />
        </Form>
      );
    }

    return <Harness />;
  },
};

export const ConfidentialSpaceCreate: Story = {
  name: "Create in confidential space",
  render: () => {
    function Harness() {
      const form = useForm({
        fields: {
          access: applyProjectAccessConstraints(
            {
              anonymous: NO_ACCESS,
              companyMembers: NO_ACCESS,
              companyMembersOptions: COMPANY_OPTIONS,
              spaceMembers: COMMENT_ACCESS,
              spaceMembersOptions: SPACE_OPTIONS,
            },
            NO_ACCESS,
          ),
        },
        onChange: ({ newValues }) => {
          newValues.access = applyProjectAccessConstraints(newValues.access, NO_ACCESS);
        },
        submit: async () => {
          console.log("Submitted:", form.values);
        },
      });

      return (
        <Form form={form}>
          <p className="text-sm text-content-dimmed mb-2">
            Parent space has no company access, so company is locked to No Access. The company selector stays visible on
            project/goal forms so space access can still be edited.
          </p>
          <AccessSelectors />
          <Submit />
        </Form>
      );
    }

    return <Harness />;
  },
};

export const HiddenCompanyOnSpaceForm: Story = {
  name: "Hidden company on space form",
  render: () => {
    function Harness() {
      const form = useForm({
        fields: {
          access: {
            anonymous: NO_ACCESS,
            companyMembers: NO_ACCESS,
            companyMembersOptions: [{ value: NO_ACCESS, label: "No Access" }],
            spaceMembers: NO_ACCESS,
            spaceMembersOptions: SPACE_OPTIONS,
          },
        },
        submit: async () => {
          console.log("Submitted:", form.values);
        },
      });

      return (
        <Form form={form}>
          <p className="text-sm text-content-dimmed mb-2">
            On space-only forms (`showSpaceAccess={false}`), the company selector is hidden when No Access is the only
            option.
          </p>
          <AccessSelectors showSpaceAccess={false} />
          <Submit />
        </Form>
      );
    }

    return <Harness />;
  },
};
