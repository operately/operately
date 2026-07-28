import * as React from "react";
import {
  IconFileExport,
  IconFileText,
  IconLetterCase,
  IconLock,
  IconShieldLock,
  IconUser,
  IconUsers,
  OptionsMenuItem,
  Link,
  Page as TurboUIPage,
} from "turboui";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { includesId } from "@/routes/paths";
import { CompanyAdmins, CompanyOwners } from "./CompanyAdmins";
import { useLoadedData } from "./loader";
import { DangerZone } from "./DangerZone";
import { Section } from "./Section";

import { usePaths } from "@/routes/paths";

export function Page() {
  const paths = usePaths();
  const { company } = useLoadedData();

  return (
    <TurboUIPage
      title={[company.name!, "Administration"]}
      size="small"
      testId="company-admin-page"
      navigation={[{ to: paths.homePath(), label: "Home" }]}
    >
      <div className="px-10 py-8">
        <div className="uppercase text-sm tracking-wide">Company Administration</div>
        <div className="text-content-accent text-3xl font-extrabold">{company.name}</div>

        <Section title="What's this?">
          <p>
            This is the company administration page where owners and admins can manage the company's settings. They
            have special permissions to add or remove team members, change who can access the application, and more. If
            you need something done, contact one of them.
          </p>

          <p className="mt-2">
            <Link to={paths.companyPermissionsPath()}>View permission breakdown</Link>
          </p>
        </Section>

        <CompanyAdmins />
        <CompanyOwners />

        <AdminsMenu />
        <OwnersMenu />
        <DangerZone />
      </div>
    </TurboUIPage>
  );
}

function AdminsMenu() {
  const paths = usePaths();
  const { adminIds, ownerIds, company } = useLoadedData();

  const me = useMe();
  const amIAdmin = includesId(adminIds, me?.id);
  const amIOwner = includesId(ownerIds, me?.id);

  // Don't show the menu at all if user is not an admin or owner
  if (!(amIAdmin || amIOwner)) {
    return null;
  }

  const managePeople = paths.companyManagePeoplePath();
  const manageBilling = paths.companyBillingPath();
  const renameCompanyPath = paths.companyRenamePath();
  const restorePath = paths.companyAdminRestoreSuspendedPeoplePath();

  return (
    <Section title="As an admin or owner, you can:">
      <div>
        <OptionsMenuItem linkTo={managePeople} icon={IconUsers} title="Manage team members" />

        <OptionsMenuItem linkTo={restorePath} icon={IconUser} title="Restore access for deactivated team members" />
        <OptionsMenuItem
          hidden={!window.appConfig.billingEnabled || !company.permissions?.canManageBilling}
          linkTo={manageBilling}
          icon={IconFileText}
          title="Manage plan"
        />
        <OptionsMenuItem
          hidden={!company.permissions?.canEditDetails}
          linkTo={renameCompanyPath}
          icon={IconLetterCase}
          title="Rename the company"
        />
      </div>
    </Section>
  );
}

function OwnersMenu() {
  const paths = usePaths();
  const { company, ownerIds } = useLoadedData();

  const me = useMe();
  const amIOwner = includesId(ownerIds, me!.id);

  // Don't show the menu at all if user is not an owner
  if (!amIOwner) {
    return null;
  }

  const manageTrustedDomains = paths.companyAdminManageTrustedDomainsPath();
  const manageAdmins = paths.companyManageAdminsPath();
  const exportCompany = paths.companyExportPath();

  return (
    <Section title="As an owner, you can:">
      <div>
        <OptionsMenuItem linkTo={manageAdmins} icon={IconShieldLock} title="Manage administrators and owners" />
        <OptionsMenuItem
          hidden={!company.permissions?.canEditTrustedEmailDomains}
          linkTo={manageTrustedDomains}
          icon={IconLock}
          title="Manage trusted email domains"
        />
        <OptionsMenuItem linkTo={exportCompany} icon={IconFileExport} title="Export company data" />
      </div>
    </Section>
  );
}
