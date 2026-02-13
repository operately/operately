import React from "react";
import { CompanyAdminAddPeoplePage } from "..";
import { ResourceAccessContent } from "./ResourceAccessContent";

interface Props {
  fullName: string;
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

export function AddedContent({
  fullName,
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
      <div className="text-content-accent text-2xl font-extrabold">{fullName} has been added</div>

      <div className="mt-4">{fullName} has been added to the company and an email has been sent to notify them.</div>

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
