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

const mockSpaces = [
  { id: "space-1", name: "Product" },
  { id: "space-2", name: "Engineering" },
  { id: "space-3", name: "Design" },
];

const mockGoals = [
  { id: "goal-1", name: "Q1 Product Roadmap" },
  { id: "goal-2", name: "Improve Performance" },
  { id: "goal-3", name: "User Research" },
];

const mockProjects = [
  { id: "project-1", name: "Website Redesign" },
  { id: "project-2", name: "Mobile App" },
  { id: "project-3", name: "API Improvements" },
];

function useInviteFlow(targetState: "invited" | "added") {
  const [state, setState] = React.useState<CompanyAdminAddPeoplePage.PageState>({ state: "form" });
  const [values, setValues] = React.useState<InviteMemberForm.Values>({
    fullName: "Alex Morgan",
    email: "alex.morgan@example.com",
    title: "Product Designer",
  });
  const [errors] = React.useState<InviteMemberForm.Errors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isGrantingAccess, setIsGrantingAccess] = React.useState(false);

  const handleFormChange = React.useCallback((field: InviteMemberForm.Field, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = React.useCallback(async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSubmitting(false);

    if (targetState === "invited") {
      setState({ state: "invited", fullName: values.fullName, inviteLink: buildInviteLink(), personId: "person-123" });
    } else {
      setState({ state: "added", fullName: values.fullName, personId: "person-123" });
    }
  }, [targetState, values.fullName]);

  const handleInviteAnother = React.useCallback(() => {
    setState({ state: "form" });
    setValues({ fullName: "", email: "", title: "" });
  }, []);

  const handleGrantAccess = React.useCallback(async (input: { personId: string; resources: Array<{ resourceType: CompanyAdminAddPeoplePage.ResourceType; resourceId: string; accessLevel: "full_access" | "edit_access" | "comment_access" | "view_access" | "no_access" }> }) => {
    setIsGrantingAccess(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsGrantingAccess(false);
    console.log("Granted access:", input);
  }, []);

  return {
    state,
    values,
    errors,
    isSubmitting,
    isGrantingAccess,
    handleFormChange,
    handleSubmit,
    handleInviteAnother,
    handleGrantAccess,
  };
}

export const TeamMemberFormToInvited: Story = {
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

export const TeamMemberFormToAdded: Story = {
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

export const OutsideCollaboratorFormToInvited: Story = {
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
        spaces={mockSpaces}
        goals={mockGoals}
        projects={mockProjects}
        onGrantAccess={flow.handleGrantAccess}
      />
    );
  },
};

export const OutsideCollaboratorFormToAdded: Story = {
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
        memberType="outside_collaborator"
        spaces={mockSpaces}
        goals={mockGoals}
        projects={mockProjects}
        onGrantAccess={flow.handleGrantAccess}
      />
    );
  },
};

export const OutsideCollaboratorInvitedWithResourceAccess: Story = {
  args: {} as any,
  render: () => {
    const flow = useInviteFlow("invited");

    React.useEffect(() => {
      flow.handleSubmit();
    }, []);

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
        spaces={mockSpaces}
        goals={mockGoals}
        projects={mockProjects}
        onGrantAccess={flow.handleGrantAccess}
      />
    );
  },
};

export const OutsideCollaboratorAddedWithResourceAccess: Story = {
  args: {} as any,
  render: () => {
    const flow = useInviteFlow("added");

    React.useEffect(() => {
      flow.handleSubmit();
    }, []);

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
        spaces={mockSpaces}
        goals={mockGoals}
        projects={mockProjects}
        onGrantAccess={flow.handleGrantAccess}
      />
    );
  },
};
