import React from "react";
import { CompanyAdminAddPeoplePage } from "..";
import { InviteLinkPanel } from "../../InviteLinkPanel";
import { ResourceAccessContent } from "./ResourceAccessContent";

interface Props {
  fullName: string;
  inviteLink: string;
  isGuest: boolean;
  spaces?: CompanyAdminAddPeoplePage.ResourceOption[];
  goals?: CompanyAdminAddPeoplePage.ResourceOption[];
  projects?: CompanyAdminAddPeoplePage.ResourceOption[];
  resourceEntries: CompanyAdminAddPeoplePage.ResourceAccessEntry[];
  resourceErrors: Record<number, string>;
  onAddResourceEntry: () => void;
  onUpdateResourceEntry: (key: number, updates: Partial<CompanyAdminAddPeoplePage.ResourceAccessEntry>) => void;
  onRemoveResourceEntry: (key: number) => void;
  permissionOptions: CompanyAdminAddPeoplePage.PermissionOption[];
  accessGranted: boolean;
}

export function InvitedContent({
  fullName,
  inviteLink,
  isGuest,
  spaces,
  goals,
  projects,
  resourceEntries,
  resourceErrors,
  onAddResourceEntry,
  onUpdateResourceEntry,
  onRemoveResourceEntry,
  permissionOptions,
  accessGranted,
}: Props) {
  return (
    <div>
      <div className="text-content-accent text-2xl font-extrabold">{fullName} has been invited by email</div>

      <InviteLinkPanel
        link={inviteLink}
        description="They've received an email with this link. You can copy it here to share again if they didn't get the email or prefer another channel."
        footer="This link (including the one in their email) expires in 24 hours."
      />

      {isGuest && (
        <ResourceAccessContent
          fullName={fullName}
          entries={resourceEntries}
          errors={resourceErrors}
          onAddEntry={onAddResourceEntry}
          onUpdateEntry={onUpdateResourceEntry}
          onRemoveEntry={onRemoveResourceEntry}
          spaces={spaces}
          goals={goals}
          projects={projects}
          permissionOptions={permissionOptions}
          accessGranted={accessGranted}
        />
      )}
    </div>
  );
}
