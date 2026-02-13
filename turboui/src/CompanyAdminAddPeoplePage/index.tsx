import React from "react";

import { match } from "ts-pattern";
import { PrimaryButton, SecondaryButton } from "../Button";
import { InviteLinkPanel } from "../InviteLinkPanel";
import { InviteMemberForm } from "../InviteMemberForm";
import { Navigation } from "../Page/Navigation";
import { useHtmlTitle } from "../Page/useHtmlTitle";
import { ResourceAccessForm } from "./ResourceAccessForm";

export namespace CompanyAdminAddPeoplePage {
  export type PageState = PageStateForm | PageStateInvited | PageStateAdded;
  export type PageStateForm = { state: "form" };
  export type PageStateInvited = { state: "invited"; inviteLink: string; fullName: string; personId: string };
  export type PageStateAdded = { state: "added"; fullName: string; personId: string };
  export type MemberType = "team_member" | "outside_collaborator";

  export type ResourceType = "space" | "goal" | "project";

  export interface ResourceOption {
    id: string;
    name: string;
  }

  type AccessOptions = "full_access" | "edit_access" | "comment_access" | "view_access" | "no_access";

  export interface ResourceAccessEntry {
    key: number;
    resourceType: ResourceType;
    resourceId: string;
    resourceName: string;
    accessLevel: AccessOptions;
  }

  export interface PermissionOption {
    value: AccessOptions;
    label: string;
  }

  export interface Props {
    companyName: string;
    navigationItems: Navigation.Item[];
    state: PageState;
    formValues: InviteMemberForm.Values;
    formErrors?: InviteMemberForm.Errors;
    onFormChange: (field: InviteMemberForm.Field, value: string) => void;
    onSubmit: () => void | Promise<void>;
    onCancel?: () => void;
    onInviteAnother?: () => void;
    inviteAnotherLabel?: string;
    onGoBack?: () => void;
    goBackLabel?: string;
    isSubmitting?: boolean;
    memberType?: MemberType;
    spaces?: ResourceOption[];
    goals?: ResourceOption[];
    projects?: ResourceOption[];
    onGrantAccess?: (input: { personId: string; resources: Array<{ resourceType: ResourceType; resourceId: string; accessLevel: AccessOptions }> }) => Promise<any>;
    isGrantingAccess?: boolean;
    permissionOptions?: PermissionOption[];
  }
}

type MemberCopy = {
  pageTitlePrefix: string;
  formTitle: string;
  helperText: React.ReactNode;
  submitLabel: string;
  inviteAnotherLabel: string;
};

const helperTextWrapper = (content: React.ReactNode) => (
  <div className="my-8 text-center px-20">
    <span className="font-bold">What happens next?</span> {content}
  </div>
);

const memberCopy: Record<CompanyAdminAddPeoplePage.MemberType, MemberCopy> = {
  team_member: {
    pageTitlePrefix: "Invite new team member",
    formTitle: "Invite a new team member",
    helperText: helperTextWrapper(
      <>
        If the new member already has an account, they will be added to your company. If they don&apos;t have an
        account, we&apos;ll send them an email with an invitation link, and you&apos;ll get the same link here to share
        if needed. The link will be valid for 24 hours.
      </>,
    ),
    submitLabel: "Invite Member",
    inviteAnotherLabel: "Invite Another Member",
  },
  outside_collaborator: {
    pageTitlePrefix: "Invite new outside collaborator",
    formTitle: "Invite a new outside collaborator",
    helperText: helperTextWrapper(
      <>
        If the outside collaborator already has an account, they will be added to your company as an outside
        collaborator. If they don&apos;t have an account, we&apos;ll send them an email with an invitation link, and
        you&apos;ll get the same link here to share if needed. The link will be valid for 24 hours.
      </>,
    ),
    submitLabel: "Invite Collaborator",
    inviteAnotherLabel: "Invite Another Outside Collaborator",
  },
};

export function CompanyAdminAddPeoplePage(props: CompanyAdminAddPeoplePage.Props) {
  const memberType = props.memberType ?? "team_member";
  const copy = memberCopy[memberType];

  const pageTitle = [copy.pageTitlePrefix, props.companyName];
  useHtmlTitle(pageTitle);

  const sizeClassName = props.state.state === "form" ? "max-w-2xl" : "max-w-4xl";
  const bodyClassName = props.state.state === "form" ? "px-10 py-8" : "px-12 py-10";

  const helperText = copy.helperText;
  const inviteAnotherLabel = props.inviteAnotherLabel ?? copy.inviteAnotherLabel;

  const belowCardContent = match(props.state)
    .with({ state: "form" }, () => helperText)
    .with({ state: "invited" }, () => (
      <SuccessActions
        onInviteAnother={props.onInviteAnother}
        inviteAnotherLabel={inviteAnotherLabel}
        onGoBack={props.onGoBack}
        goBackLabel={props.goBackLabel}
      />
    ))
    .with({ state: "added" }, () => (
      <SuccessActions
        onInviteAnother={props.onInviteAnother}
        inviteAnotherLabel={inviteAnotherLabel}
        onGoBack={props.onGoBack}
        goBackLabel={props.goBackLabel}
      />
    ))
    .exhaustive();

  return (
    <div className={`mx-auto relative sm:my-10 ${sizeClassName}`}>
      <Navigation items={props.navigationItems} />
      <div className="relative bg-surface-base min-h-dvh sm:min-h-0 sm:border sm:border-surface-outline sm:rounded-lg sm:shadow-xl">
        <div className={bodyClassName}>
          {match(props.state)
            .with({ state: "form" }, () => (
              <InviteMemberForm
                title={copy.formTitle}
                values={props.formValues}
                errors={props.formErrors}
                onChange={props.onFormChange}
                onSubmit={props.onSubmit}
                onCancel={props.onCancel}
                isSubmitting={props.isSubmitting}
                submitLabel={copy.submitLabel}
              />
            ))
            .with({ state: "invited" }, (state) => (
              <div>
                <div className="text-content-accent text-2xl font-extrabold">
                  {state.fullName} has been invited by email
                </div>

                <InviteLinkPanel
                  link={state.inviteLink}
                  description="They've received an email with this link. You can copy it here to share again if they didn't get the email or prefer another channel."
                  footer="This link (including the one in their email) expires in 24 hours."
                />

                <ResourceAccessForm
                  personId={state.personId}
                  fullName={state.fullName}
                  spaces={props.spaces}
                  goals={props.goals}
                  projects={props.projects}
                  onGrantAccess={props.onGrantAccess}
                  isGrantingAccess={props.isGrantingAccess}
                  permissionOptions={props.permissionOptions}
                />
              </div>
            ))
            .with({ state: "added" }, (state) => (
              <div>
                <div className="text-content-accent text-2xl font-extrabold">
                  {state.fullName} has been added
                </div>

                <ResourceAccessForm
                  personId={state.personId}
                  fullName={state.fullName}
                  spaces={props.spaces}
                  goals={props.goals}
                  projects={props.projects}
                  onGrantAccess={props.onGrantAccess}
                  isGrantingAccess={props.isGrantingAccess}
                  permissionOptions={props.permissionOptions}
                />
              </div>
            ))
            .exhaustive()}
        </div>
      </div>
      {belowCardContent}
    </div>
  );
}

function SuccessActions({
  onInviteAnother,
  inviteAnotherLabel,
  onGoBack,
  goBackLabel,
}: {
  onInviteAnother?: () => void;
  inviteAnotherLabel?: string;
  onGoBack?: () => void;
  goBackLabel?: string;
}) {
  const hasInviteAnother = Boolean(onInviteAnother);
  const hasGoBack = Boolean(onGoBack);
  if (!hasInviteAnother && !hasGoBack) return null;

  return (
    <div className="flex flex-col items-center gap-3 mt-8 sm:flex-row sm:justify-center">
      {hasInviteAnother && (
        <PrimaryButton onClick={onInviteAnother} testId="invite-another-button">
          {inviteAnotherLabel ?? "Invite Another Member"}
        </PrimaryButton>
      )}
      {hasGoBack && (
        <SecondaryButton onClick={onGoBack} testId="invite-success-go-back">
          {goBackLabel ?? "Back to Manage Team Members"}
        </SecondaryButton>
      )}
    </div>
  );
}
