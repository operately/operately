import React, { useState } from "react";

import { Avatar, type AvatarPerson } from "../Avatar";
import { ConfirmByTypingModal } from "../ConfirmByTypingModal";
import {
  IconFileExport,
  IconFileText,
  IconLetterCase,
  IconLock,
  IconShieldLock,
  IconSpeakerphone,
  IconTrash,
  IconUser,
  IconUsers,
} from "../icons";
import { Link } from "../Link";
import { OptionsMenuItem } from "../OptionsMenuItem";
import { Page } from "../Page";
import { PageSection } from "../PageSection";
import { PRODUCT_RELEASES_PAGE_URL } from "../ProductReleaseAnnouncement/types";

export namespace CompanyAdminPage {
  export type Person = AvatarPerson;

  export interface CurrentRelease {
    version: string;
    title?: string;
  }

  export interface Props {
    companyName: string;
    admins: Person[];
    owners: Person[];

    isAdmin: boolean;
    isOwner: boolean;
    billingEnabled: boolean;
    canManageBilling: boolean;
    canEditDetails: boolean;
    canEditTrustedEmailDomains: boolean;

    homePath: string;
    permissionsPath: string;
    managePeoplePath: string;
    restoreSuspendedPeoplePath: string;
    billingPath: string;
    renameCompanyPath: string;
    manageAdminsPath: string;
    trustedDomainsPath: string;
    exportPath: string;

    /** Latest published release, when the company should see release announcements. */
    currentRelease?: CurrentRelease | null;

    onDeleteCompany: () => Promise<void>;
  }
}

export function CompanyAdminPage(props: CompanyAdminPage.Props) {
  const navigation = React.useMemo(() => [{ to: props.homePath, label: "Home" }], [props.homePath]);

  return (
    <Page
      title={[props.companyName, "Administration"]}
      size="small"
      testId="company-admin-page"
      navigation={navigation}
    >
      <div className="px-10 py-8">
        <div className="uppercase text-sm tracking-wide">Company Administration</div>
        <div className="text-content-accent text-3xl font-extrabold">{props.companyName}</div>

        <PageSection title="What's this?">
          <p>
            This is the company administration page where owners and admins can manage the company's settings. They have
            special permissions to add or remove team members, change who can access the application, and more. If you
            need something done, contact one of them.
          </p>

          <p className="mt-2">
            <Link to={props.permissionsPath}>View permission breakdown</Link>
          </p>
        </PageSection>

        {props.admins.length > 0 && (
          <PageSection title="Administrators">
            <PeopleList people={props.admins} />
          </PageSection>
        )}

        {props.owners.length > 0 && (
          <PageSection title="Account Owners">
            <PeopleList people={props.owners} />
          </PageSection>
        )}

        <AdminsMenu {...props} />
        <OwnersMenu {...props} />
        <CurrentReleaseSection release={props.currentRelease} />
        <DangerZone
          isOwner={props.isOwner}
          companyName={props.companyName}
          onDeleteCompany={props.onDeleteCompany}
        />
      </div>
    </Page>
  );
}

function AdminsMenu(props: CompanyAdminPage.Props) {
  if (!(props.isAdmin || props.isOwner)) {
    return null;
  }

  return (
    <PageSection title="As an admin or owner, you can:">
      <div>
        <OptionsMenuItem linkTo={props.managePeoplePath} icon={IconUsers} title="Manage team members" />
        <OptionsMenuItem
          linkTo={props.restoreSuspendedPeoplePath}
          icon={IconUser}
          title="Restore access for deactivated team members"
        />
        <OptionsMenuItem
          hidden={!props.billingEnabled || !props.canManageBilling}
          linkTo={props.billingPath}
          icon={IconFileText}
          title="Manage plan"
        />
        <OptionsMenuItem
          hidden={!props.canEditDetails}
          linkTo={props.renameCompanyPath}
          icon={IconLetterCase}
          title="Rename the company"
        />
      </div>
    </PageSection>
  );
}

function OwnersMenu(props: CompanyAdminPage.Props) {
  if (!props.isOwner) {
    return null;
  }

  return (
    <PageSection title="As an owner, you can:">
      <div>
        <OptionsMenuItem
          linkTo={props.manageAdminsPath}
          icon={IconShieldLock}
          title="Manage administrators and owners"
        />
        <OptionsMenuItem
          hidden={!props.canEditTrustedEmailDomains}
          linkTo={props.trustedDomainsPath}
          icon={IconLock}
          title="Manage trusted email domains"
        />
        <OptionsMenuItem linkTo={props.exportPath} icon={IconFileExport} title="Export company data" />
      </div>
    </PageSection>
  );
}

function CurrentReleaseSection({ release }: { release?: CompanyAdminPage.CurrentRelease | null }) {
  if (!release) return null;

  return (
    <PageSection title="Version" testId="company-admin-current-release">
      <OptionsMenuItem
        icon={IconSpeakerphone}
        linkTo={PRODUCT_RELEASES_PAGE_URL}
        linkTarget="_blank"
        title={`Operately ${release.version}`}
        description={release.title}
        truncateDescription
      />
    </PageSection>
  );
}

function PeopleList({ people }: { people: AvatarPerson[] }) {
  return (
    <div className="flex flex-wrap gap-4">
      {people.map((person) => (
        <div key={person.id ?? person.fullName} className="flex items-center gap-2">
          <Avatar person={person} size="small" />
          <div className="font-medium">{person.fullName}</div>
        </div>
      ))}
    </div>
  );
}

function DangerZone({
  isOwner,
  companyName,
  onDeleteCompany,
}: {
  isOwner: boolean;
  companyName: string;
  onDeleteCompany: () => Promise<void>;
}) {
  if (!isOwner) return null;

  return (
    <PageSection title="Danger Zone:">
      <div className="bg-surface-base">
        <DeleteCompanyItem companyName={companyName} onDeleteCompany={onDeleteCompany} />
      </div>
    </PageSection>
  );
}

function DeleteCompanyItem({
  companyName,
  onDeleteCompany,
}: {
  companyName: string;
  onDeleteCompany: () => Promise<void>;
}) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <OptionsMenuItem
        icon={IconTrash}
        title="Delete this company"
        onClick={() => setShowModal(true)}
        danger
        description="Permanently delete the company and all its resources. This action cannot be undone."
      />

      <ConfirmByTypingModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={onDeleteCompany}
        title="Delete Company"
        confirmationValue={companyName}
        warningMessage="This action cannot be undone."
        warningDescription={
          <>
            This will permanently delete <strong>{companyName}</strong> and its spaces, goals, projects, and other
            resources.
          </>
        }
        confirmLabel="Delete Company"
        loadingLabel="Deleting..."
        inputTestId="confirm-delete-input"
        confirmTestId="confirm-delete-button"
      />
    </>
  );
}
