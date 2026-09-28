import React, { useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import { Avatar, type AvatarPerson } from "../Avatar";
import { translationText } from "../i18n";
import { ConfirmByTypingModal } from "../ConfirmByTypingModal";
import {
  IconFileExport,
  IconFileText,
  IconLetterCase,
  IconLock,
  IconShieldLock,
  IconTrash,
  IconUser,
  IconUsers,
} from "../icons";
import { Link } from "../Link";
import { OptionsMenuItem } from "../OptionsMenuItem";
import { Page } from "../Page";
import { PageSection } from "../PageSection";

export namespace CompanyAdminPage {
  export type Person = AvatarPerson;

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

    onDeleteCompany: () => Promise<void>;
  }
}

export function CompanyAdminPage(props: CompanyAdminPage.Props) {
  const { t } = useTranslation();
  const navigation = React.useMemo(() => [{ to: props.homePath, label: t("Home") }], [props.homePath, t]);

  return (
    <Page
      title={[props.companyName, translationText(t("Administration"))]}
      size="small"
      testId="company-admin-page"
      navigation={navigation}
    >
      <div className="px-10 py-8">
        <div className="uppercase text-sm tracking-wide">{t("Company Administration")}</div>
        <div className="text-content-accent text-3xl font-extrabold">{props.companyName}</div>

        <PageSection title={t("What's this?")}>
          <p>
            {t(
              "This is the company administration page where owners and admins can manage the company's settings. They have special permissions to add or remove team members, change who can access the application, and more. If you need something done, contact one of them.",
            )}
          </p>

          <p className="mt-2">
            <Link to={props.permissionsPath}>{t("View permission breakdown")}</Link>
          </p>
        </PageSection>

        {props.admins.length > 0 && (
          <PageSection title={t("Administrators")}>
            <PeopleList people={props.admins} />
          </PageSection>
        )}

        {props.owners.length > 0 && (
          <PageSection title={t("Account Owners")}>
            <PeopleList people={props.owners} />
          </PageSection>
        )}

        <AdminsMenu {...props} />
        <OwnersMenu {...props} />
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
  const { t } = useTranslation();

  if (!(props.isAdmin || props.isOwner)) {
    return null;
  }

  return (
    <PageSection title={t("As an admin or owner, you can:")}>
      <div>
        <OptionsMenuItem linkTo={props.managePeoplePath} icon={IconUsers} title={t("Manage team members")} />
        <OptionsMenuItem
          linkTo={props.restoreSuspendedPeoplePath}
          icon={IconUser}
          title={t("Restore access for deactivated team members")}
        />
        <OptionsMenuItem
          hidden={!props.billingEnabled || !props.canManageBilling}
          linkTo={props.billingPath}
          icon={IconFileText}
          title={t("Manage plan")}
        />
        <OptionsMenuItem
          hidden={!props.canEditDetails}
          linkTo={props.renameCompanyPath}
          icon={IconLetterCase}
          title={t("Rename the company")}
        />
      </div>
    </PageSection>
  );
}

function OwnersMenu(props: CompanyAdminPage.Props) {
  const { t } = useTranslation();

  if (!props.isOwner) {
    return null;
  }

  return (
    <PageSection title={t("As an owner, you can:")}>
      <div>
        <OptionsMenuItem
          linkTo={props.manageAdminsPath}
          icon={IconShieldLock}
          title={t("Manage administrators and owners")}
        />
        <OptionsMenuItem
          hidden={!props.canEditTrustedEmailDomains}
          linkTo={props.trustedDomainsPath}
          icon={IconLock}
          title={t("Manage trusted email domains")}
        />
        <OptionsMenuItem linkTo={props.exportPath} icon={IconFileExport} title={t("Export company data")} />
      </div>
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
  const { t } = useTranslation();

  if (!isOwner) return null;

  return (
    <PageSection title={t("Danger Zone:")}>
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
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <OptionsMenuItem
        icon={IconTrash}
        title={t("Delete this company")}
        onClick={() => setShowModal(true)}
        danger
        description={translationText(t("Permanently delete the company and all its resources. This action cannot be undone."))}
      />

      <ConfirmByTypingModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={onDeleteCompany}
        title={translationText(t("Delete Company"))}
        confirmationValue={companyName}
        warningMessage={translationText(t("This action cannot be undone."))}
        warningDescription={
          <Trans
            i18nKey="This will permanently delete <strong>{{companyName}}</strong> and its spaces, goals, projects, and other resources."
            values={{ companyName }}
            components={{ strong: <strong /> }}
          />
        }
        confirmLabel={translationText(t("Delete Company"))}
        loadingLabel={translationText(t("Deleting..."))}
        inputTestId="confirm-delete-input"
        confirmTestId="confirm-delete-button"
      />
    </>
  );
}
