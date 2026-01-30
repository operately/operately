import React from "react";

import { match } from "ts-pattern";
import { PrimaryButton } from "../Button";
import { InviteLinkPanel } from "../InviteLinkPanel";
import { InviteMemberForm } from "../InviteMemberForm";
import { Navigation } from "../Page/Navigation";
import { useHtmlTitle } from "../Page/useHtmlTitle";

export namespace CompanyAdminAddPeoplePage {
  export type PageState = PageStateForm | PageStateInvited | PageStateAdded;
  export type PageStateForm = { state: "form" };
  export type PageStateInvited = { state: "invited"; inviteLink: string; fullName: string };
  export type PageStateAdded = { state: "added"; fullName: string };
  export type MemberType = "team_member" | "outside_collaborator";

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
    isSubmitting?: boolean;
    memberType?: MemberType;
  }
}

const celebrationEmoji = "\u{1F389}";

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
        If the new member already has an account, they will be added to your company. If they don&apos;t have an account,
        you will get an invitation link to share with them. The link will be valid for 24 hours.
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
        collaborator. If they don&apos;t have an account, you will get an invitation link to share with them. The link
        will be valid for 24 hours.
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
    .with({ state: "invited" }, () => <InviteAnotherButton onClick={props.onInviteAnother} label={inviteAnotherLabel} />)
    .with({ state: "added" }, () => <InviteAnotherButton onClick={props.onInviteAnother} label={inviteAnotherLabel} />)
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
                  {state.fullName} has been invited {celebrationEmoji}
                </div>

                <InviteLinkPanel
                  link={state.inviteLink}
                  description="Share this link with them to allow them to join your company."
                  footer="This link will expire in 24 hours."
                />
              </div>
            ))
            .with({ state: "added" }, (state) => (
              <div className="text-content-accent text-2xl font-extrabold">
                {state.fullName} has been added {celebrationEmoji}
              </div>
            ))
            .exhaustive()}
        </div>
      </div>
      {belowCardContent}
    </div>
  );
}

function InviteAnotherButton({ onClick, label }: { onClick?: () => void; label?: string }) {
  if (!onClick) return null;

  return (
    <div className="flex items-center gap-3 mt-8 justify-center">
      <PrimaryButton onClick={onClick} testId="invite-another-button">
        {label ?? "Invite Another Member"}
      </PrimaryButton>
    </div>
  );
}
