import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as React from "react";
import { IconLetterCase, IconLock, IconRobotFace, IconShieldLock, IconUser, IconUsers } from "turboui";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { includesId } from "@/routes/paths";
import { Link } from "turboui";
import { CompanyAdmins, CompanyOwners } from "./CompanyAdmins";
import { useLoadedData } from "./loader";
import { NavigationBackToLobby } from "./NavigationBackToLobby";
import { OptionsMenuItem } from "./OptionsMenu";

import { usePaths } from "@/routes/paths";
import { hasFeature } from "../../models/companies";
export function Page() {
  const paths = usePaths();
  const { company } = useLoadedData();

  return (
    <Pages.Page title={[company.name!, "Administration"]} testId="company-admin-page">
      <Paper.Root size="small">
        <NavigationBackToLobby />

        <Paper.Body minHeight="none">
          <div className="uppercase text-sm tracking-wide">Company Administration</div>
          <div className="text-content-accent text-3xl font-extrabold">{company.name}</div>

          <Paper.Section title="What's this?">
            <p>
              This is the company administration page where owners and admins can manage the company's settings. They
              have special permissions to add or remove people, change who can access the applicacation, and more. If
              you need something done, contact one of them.
            </p>

            <p className="mt-2">
              <Link to={paths.companyPermissionsPath()}>View permission breakdown</Link>
            </p>
          </Paper.Section>

          <CompanyAdmins />
          <CompanyOwners />

          <AdminsMenu />
          <OwnersMenu />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function AdminsMenu() {
  const paths = usePaths();
  const { adminIds, ownerIds, company } = useLoadedData();

  const me = useMe();
  const amIAdmin = includesId(adminIds, me!.id);
  const amIOwner = includesId(ownerIds, me!.id);

  // Don't show the menu at all if user is not an admin or owner
  if (!(amIAdmin || amIOwner)) {
    return null;
  }

  const managePeople = paths.companyManagePeoplePath();
  const manageAgents = paths.companyManageAiAgentsPath();
  const renameCompanyPath = paths.companyRenamePath();
  const restorePath = paths.companyAdminRestoreSuspendedPeoplePath();

  return (
    <Paper.Section title="As an admin or owner, you can:">
      <div>
        <OptionsMenuItem linkTo={managePeople} icon={IconUsers} title="Invite people" />

        {hasFeature(company, "ai") && (
          <OptionsMenuItem linkTo={manageAgents} icon={IconRobotFace} title="Manage AI agents" />
        )}

        <OptionsMenuItem linkTo={restorePath} icon={IconUser} title="Restore access for deactivated team members" />
        <OptionsMenuItem linkTo={renameCompanyPath} icon={IconLetterCase} title="Rename the company" />
      </div>
    </Paper.Section>
  );
}

function OwnersMenu() {
  const paths = usePaths();
  const { ownerIds } = useLoadedData();

  const me = useMe();
  const amIOwner = includesId(ownerIds, me!.id);

  // Don't show the menu at all if user is not an owner
  if (!amIOwner) {
    return null;
  }

  const manageTrustedDomains = paths.companyAdminManageTrustedDomainsPath();
  const manageAdmins = paths.companyManageAdminsPath();

  return (
    <Paper.Section title="As an owner, you can:">
      <div>
        <OptionsMenuItem linkTo={manageAdmins} icon={IconShieldLock} title="Manage administrators and owners" />
        <OptionsMenuItem linkTo={manageTrustedDomains} icon={IconLock} title="Manage trusted email domains" />
      </div>
    </Paper.Section>
  );
}
