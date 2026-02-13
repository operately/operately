import React from "react";

import { match } from "ts-pattern";
import { PrimaryButton, SecondaryButton } from "../Button";
import { InviteMemberForm } from "../InviteMemberForm";
import { Navigation } from "../Page/Navigation";
import { useHtmlTitle } from "../Page/useHtmlTitle";
import { AddedContent } from "./components/AddedContent";
import { InvitedContent } from "./components/InvitedContent";

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
    onGrantAccess?: (input: {
      personId: string;
      resources: Array<{ resourceType: ResourceType; resourceId: string; accessLevel: AccessOptions }>;
    }) => Promise<any>;
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

const DEFAULT_PERMISSION_OPTIONS: CompanyAdminAddPeoplePage.PermissionOption[] = [
  { value: "full_access", label: "Full Access" },
  { value: "edit_access", label: "Edit Access" },
  { value: "comment_access", label: "Comment Access" },
  { value: "view_access", label: "View Access" },
];

export function CompanyAdminAddPeoplePage(props: CompanyAdminAddPeoplePage.Props) {
  const memberType = props.memberType ?? "team_member";
  const copy = memberCopy[memberType];
  const isGuest = memberType === "outside_collaborator";

  const resourceAccess = useResourceAccess();

  const handleGrantAccessButtonClick = React.useCallback(async () => {
    const personId = props.state.state === "invited" || props.state.state === "added" ? props.state.personId : "";
    await resourceAccess.submitEntries(personId, props.onGrantAccess || (() => Promise.resolve()));
  }, [resourceAccess, props.state, props.onGrantAccess]);

  const pageTitle = [copy.pageTitlePrefix, props.companyName];
  useHtmlTitle(pageTitle);

  const sizeClassName = props.state.state === "form" ? "max-w-2xl" : "max-w-4xl";
  const bodyClassName = props.state.state === "form" ? "px-10 py-8" : "px-12 py-10";

  const helperText = copy.helperText;
  const inviteAnotherLabel = props.inviteAnotherLabel ?? copy.inviteAnotherLabel;

  const showSuccessActions = props.state.state !== "form" && (!isGuest || resourceAccess.accessGranted);
  const showGrantAccessButton = props.state.state !== "form" && isGuest && !resourceAccess.accessGranted;
  const permissionOptions = props.permissionOptions ?? DEFAULT_PERMISSION_OPTIONS;

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
              <InvitedContent
                fullName={state.fullName}
                inviteLink={state.inviteLink}
                isGuest={isGuest}
                spaces={props.spaces}
                goals={props.goals}
                projects={props.projects}
                entries={resourceAccess.entries}
                errors={resourceAccess.errors}
                onAddEntry={resourceAccess.addEntry}
                onUpdateEntry={resourceAccess.updateEntry}
                onRemoveEntry={resourceAccess.removeEntry}
                permissionOptions={permissionOptions}
                accessGranted={resourceAccess.accessGranted}
              />
            ))
            .with({ state: "added" }, (state) => (
              <AddedContent
                fullName={state.fullName}
                isGuest={isGuest}
                spaces={props.spaces}
                goals={props.goals}
                projects={props.projects}
                entries={resourceAccess.entries}
                errors={resourceAccess.errors}
                onAddEntry={resourceAccess.addEntry}
                onUpdateEntry={resourceAccess.updateEntry}
                onRemoveEntry={resourceAccess.removeEntry}
                permissionOptions={permissionOptions}
                accessGranted={resourceAccess.accessGranted}
              />
            ))
            .exhaustive()}
        </div>
      </div>
      {match(props.state)
        .with({ state: "form" }, () => helperText)
        .otherwise(() =>
          showSuccessActions ? (
            <SuccessActions
              onInviteAnother={() => {
                resourceAccess.reset();
                props.onInviteAnother?.();
              }}
              inviteAnotherLabel={inviteAnotherLabel}
              onGoBack={props.onGoBack}
              goBackLabel={props.goBackLabel}
            />
          ) : showGrantAccessButton ? (
            <GrantAccessButton onClick={handleGrantAccessButtonClick} isLoading={props.isGrantingAccess} />
          ) : null,
        )}
    </div>
  );
}

function GrantAccessButton({ onClick, isLoading }: { onClick: () => void; isLoading?: boolean }) {
  return (
    <div className="flex justify-center mt-4">
      <PrimaryButton onClick={onClick} testId="grant-access-button" loading={isLoading}>
        Grant Access
      </PrimaryButton>
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

function newResourceEntry(): CompanyAdminAddPeoplePage.ResourceAccessEntry {
  return {
    key: Math.random(),
    resourceType: "space",
    resourceId: "",
    resourceName: "",
    accessLevel: "edit_access",
  };
}

function useResourceAccess() {
  const [accessGranted, setAccessGranted] = React.useState(false);
  const [entries, setEntries] = React.useState<CompanyAdminAddPeoplePage.ResourceAccessEntry[]>([newResourceEntry()]);
  const [errors, setErrors] = React.useState<Record<number, string>>({});

  const addEntry = React.useCallback(() => {
    setEntries((prev) => [...prev, newResourceEntry()]);
  }, []);

  const updateEntry = React.useCallback(
    (key: number, updates: Partial<CompanyAdminAddPeoplePage.ResourceAccessEntry>) => {
      setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, ...updates } : e)));
      if (updates.resourceId) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[key];
          return newErrors;
        });
      }
    },
    [],
  );

  const removeEntry = React.useCallback((key: number) => {
    setEntries((prev) => prev.filter((e) => e.key !== key));
  }, []);

  const submitEntries = React.useCallback(
    async (
      personId: string,
      onGrantAccess: (input: {
        personId: string;
        resources: Array<{
          resourceType: CompanyAdminAddPeoplePage.ResourceType;
          resourceId: string;
          accessLevel: CompanyAdminAddPeoplePage.ResourceAccessEntry["accessLevel"];
        }>;
      }) => Promise<any>,
    ) => {
      const newErrors: Record<number, string> = {};
      entries.forEach((entry) => {
        if (!entry.resourceId) {
          newErrors[entry.key] = "Please select a resource";
        }
      });

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      await onGrantAccess({
        personId,
        resources: entries.map((r) => ({
          resourceType: r.resourceType,
          resourceId: r.resourceId,
          accessLevel: r.accessLevel,
        })),
      });
      setAccessGranted(true);
    },
    [entries],
  );

  const reset = React.useCallback(() => {
    setEntries([newResourceEntry()]);
    setErrors({});
    setAccessGranted(false);
  }, []);

  return {
    entries,
    errors,
    accessGranted,
    addEntry,
    updateEntry,
    removeEntry,
    reset,
    submitEntries,
  };
}
