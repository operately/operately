import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Page } from "../Page";
import {
  AccessSelectors,
  FieldGroup,
  Form,
  PasswordInput,
  SelectGoal,
  SelectPerson,
  SelectStatus,
  Submit,
  SubmitButton,
  TextInput,
  useForm,
} from "./index";

const meta: Meta = {
  title: "Components/Forms/Composed",
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="sm:mt-12">
        <Page size="medium" title="Composed Forms">
          <div className="p-12">
            <Story />
          </div>
        </Page>
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj;

export const AuthForm: Story = {
  render: () => {
    function Harness() {
      const form = useForm({
        fields: { email: "", password: "" },
        submit: async () => {
          console.log("Signed in:", form.values);
        },
      });

      return (
        <Form form={form}>
          <FieldGroup>
            <TextInput field="email" label="Email" required placeholder="you@company.com" />
            <PasswordInput field="password" label="Password" required placeholder="Password" minLength={12} />
          </FieldGroup>
          <Submit saveText="Sign in" layout="centered" buttonSize="base" />
        </Form>
      );
    }

    return <Harness />;
  },
};

export const RenameCompanyForm: Story = {
  render: () => {
    function Harness() {
      const form = useForm({
        fields: { name: "Acme Inc." },
        submit: async () => {
          console.log("Renamed:", form.values);
        },
        cancel: async () => {
          console.log("Cancelled");
        },
      });

      return (
        <Form form={form}>
          <FieldGroup>
            <TextInput field="name" label="Company Name" minLength={2} maxLength={100} required />
          </FieldGroup>
          <Submit saveText="Save" cancelText="Cancel" />
        </Form>
      );
    }

    return <Harness />;
  },
};

export const AccessForm: Story = {
  render: () => {
    function Harness() {
      const form = useForm({
        fields: {
          access: {
            companyMembers: 70,
            companyMembersOptions: [
              { value: 0, label: "No Access" },
              { value: 10, label: "View Access" },
              { value: 70, label: "Edit Access" },
              { value: 100, label: "Full Access" },
            ],
            spaceMembers: 70,
            spaceMembersOptions: [
              { value: 0, label: "No Access" },
              { value: 10, label: "View Access" },
              { value: 70, label: "Edit Access" },
              { value: 100, label: "Full Access" },
            ],
          },
        },
        submit: async () => {
          console.log("Access saved:", form.values);
        },
      });

      return (
        <Form form={form}>
          <AccessSelectors showSpaceAccess />
          <Submit saveText="Save access" />
        </Form>
      );
    }

    return <Harness />;
  },
};

export const MultiSubmitForm: Story = {
  render: () => {
    function Harness() {
      const form = useForm({
        fields: { title: "" },
        submit: async (asDraft?: unknown) => {
          console.log(asDraft ? "Draft:" : "Published:", form.values);
        },
      });

      return (
        <Form form={form}>
          <FieldGroup>
            <TextInput field="title" label="Title" required placeholder="Document title" />
          </FieldGroup>
          <div className="mt-6 flex items-center gap-3">
            <SubmitButton
              name="publish"
              text="Publish"
              primary
              onClick={() => form.actions.submit(false)}
            />
            <SubmitButton name="draft" text="Save as draft" onClick={() => form.actions.submit(true)} />
          </div>
        </Form>
      );
    }

    return <Harness />;
  },
};

export const SelectPersonForm: Story = {
  render: () => {
    function Harness() {
      const people = [
        { id: "1", fullName: "Alice Chen", avatarUrl: null, title: "Engineer" },
        { id: "2", fullName: "Bob Rivera", avatarUrl: null, title: "Designer" },
      ];
      const searchFn = async (query: string) =>
        people.filter((person) => person.fullName.toLowerCase().includes(query.toLowerCase()));

      const form = useForm({
        fields: { champion: "" },
        submit: async () => {
          console.log("Selected:", form.values);
        },
      });

      return (
        <Form form={form}>
          <FieldGroup>
            <SelectPerson field="champion" label="Champion" searchFn={searchFn} />
          </FieldGroup>
          <Submit saveText="Save" />
        </Form>
      );
    }

    return <Harness />;
  },
};

export const SelectGoalForm: Story = {
  render: () => {
    function Harness() {
      const goals = [
        { id: "g1", name: "Increase revenue", parentGoalId: null },
        { id: "g2", name: "Expand enterprise sales", parentGoalId: "g1" },
        { id: "g3", name: "Improve retention", parentGoalId: null },
      ];

      const form = useForm({
        fields: { goal: null as (typeof goals)[number] | null },
        submit: async () => {
          console.log("Selected goal:", form.values);
        },
      });

      return (
        <Form form={form}>
          <FieldGroup>
            <SelectGoal field="goal" label="Parent goal" goals={goals} required={false} allowCompanyWide />
          </FieldGroup>
          <Submit saveText="Save" />
        </Form>
      );
    }

    return <Harness />;
  },
};

export const CheckInForm: Story = {
  render: () => {
    function Harness() {
      const form = useForm({
        fields: {
          status: null as "on_track" | "caution" | "off_track" | null,
          description: "",
        },
        submit: async () => {
          console.log("Check-in:", form.values);
        },
      });

      return (
        <Form form={form}>
          <FieldGroup>
            <SelectStatus
              field="status"
              label="Status"
              options={["on_track", "caution", "off_track"]}
              reviewer={{ fullName: "Alex Reviewer" }}
            />
            <TextInput field="description" label="What's new?" required placeholder="Write your update..." />
          </FieldGroup>
          <Submit saveText="Submit check-in" />
        </Form>
      );
    }

    return <Harness />;
  },
};
