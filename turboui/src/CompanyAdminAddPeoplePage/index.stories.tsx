import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { CompanyAdminAddPeoplePage } from ".";
import { InviteMemberForm } from "../InviteMemberForm";

const meta = {
  title: "Pages/CompanyAdminAddPeoplePage",
  component: CompanyAdminAddPeoplePage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof CompanyAdminAddPeoplePage>;

export default meta;
type Story = StoryObj<typeof meta>;

const navigationItems = [
  { label: "Company Administration", to: "/admin" },
  { label: "Manage Team Members", to: "/admin/people" },
];

function generateToken() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function buildInviteLink() {
  return `https://app.operately.com/join?token=${generateToken()}`;
}

function useInviteFlow(targetState: "invited" | "added") {
  const [state, setState] = React.useState<CompanyAdminAddPeoplePage.PageState>({ state: "form" });
  const [values, setValues] = React.useState<InviteMemberForm.Values>({
    fullName: "Alex Morgan",
    email: "alex.morgan@example.com",
    title: "Product Designer",
  });
  const [errors] = React.useState<InviteMemberForm.Errors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleFormChange = React.useCallback((field: InviteMemberForm.Field, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = React.useCallback(async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSubmitting(false);

    if (targetState === "invited") {
      setState({ state: "invited", fullName: values.fullName, inviteLink: buildInviteLink() });
    } else {
      setState({ state: "added", fullName: values.fullName });
    }
  }, [targetState, values.fullName]);

  const handleInviteAnother = React.useCallback(() => {
    setState({ state: "form" });
    setValues({ fullName: "", email: "", title: "" });
  }, []);

  return {
    state,
    values,
    errors,
    isSubmitting,
    handleFormChange,
    handleSubmit,
    handleInviteAnother,
  };
}

export const FormToInvited: Story = {
  args: {} as any,
  render: () => {
    const flow = useInviteFlow("invited");

    return (
      <CompanyAdminAddPeoplePage
        companyName="Operately"
        navigationItems={navigationItems}
        state={flow.state}
        formValues={flow.values}
        formErrors={flow.errors}
        onFormChange={flow.handleFormChange}
        onSubmit={flow.handleSubmit}
        onInviteAnother={flow.handleInviteAnother}
        onGoBack={() => console.log("Go back")}
        goBackLabel="Back to Manage Team Members"
        onCancel={() => console.log("Cancel invite")}
        isSubmitting={flow.isSubmitting}
      />
    );
  },
};

export const FormToAdded: Story = {
  args: {} as any,
  render: () => {
    const flow = useInviteFlow("added");

    return (
      <CompanyAdminAddPeoplePage
        companyName="Operately"
        navigationItems={navigationItems}
        state={flow.state}
        formValues={flow.values}
        formErrors={flow.errors}
        onFormChange={flow.handleFormChange}
        onSubmit={flow.handleSubmit}
        onInviteAnother={flow.handleInviteAnother}
        onGoBack={() => console.log("Go back")}
        goBackLabel="Back to Manage Team Members"
        onCancel={() => console.log("Cancel invite")}
        isSubmitting={flow.isSubmitting}
      />
    );
  },
};

export const OutsideCollaboratorForm: Story = {
  args: {} as any,
  render: () => {
    const flow = useInviteFlow("invited");

    return (
      <CompanyAdminAddPeoplePage
        companyName="Operately"
        navigationItems={navigationItems}
        state={flow.state}
        formValues={flow.values}
        formErrors={flow.errors}
        onFormChange={flow.handleFormChange}
        onSubmit={flow.handleSubmit}
        onInviteAnother={flow.handleInviteAnother}
        onGoBack={() => console.log("Go back")}
        goBackLabel="Back to Manage Team Members"
        onCancel={() => console.log("Cancel invite")}
        isSubmitting={flow.isSubmitting}
        memberType="outside_collaborator"
      />
    );
  },
};
