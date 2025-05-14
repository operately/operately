import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";
import * as React from "react";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { Paths, includesId } from "@/routes/paths";
import { Link } from "turboui";
import { CompanyAdmins, CompanyOwners } from "./CompanyAdmins";
import { useLoadedData } from "./loader";
import { NavigationBackToLobby } from "./NavigationBackToLobby";
import { OptionsMenuItem } from "./OptionsMenu";

export function Page() {
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
              <Link to={Paths.companyPermissionsPath()}>View permission breakdown</Link>
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
  const { adminIds, ownerIds } = useLoadedData();

  const me = useMe();
  const amIAdmin = includesId(adminIds, me!.id);
  const amIOwner = includesId(ownerIds, me!.id);

  // Don't show the menu at all if user is not an admin or owner
  if (!(amIAdmin || amIOwner)) {
    return null;
  }

  const managePeople = Paths.companyManagePeoplePath();
  const renameCompanyPath = Paths.companyRenamePath();
  const restorePath = Paths.companyAdminRestoreSuspendedPeoplePath();

  return (
    <Paper.Section title="As an admin or owner, you can:">
      <div>
        <OptionsMenuItem linkTo={managePeople} icon={Icons.IconUsers} title="Manage team members" />

        <OptionsMenuItem
          linkTo={restorePath}
          icon={Icons.IconUser}
          title="Restore access for deactivated team members"
        />

        <OptionsMenuItem linkTo={renameCompanyPath} icon={Icons.IconLetterCase} title="Rename the company" />
      </div>
    </Paper.Section>
  );
}

function OwnersMenu() {
  const { ownerIds } = useLoadedData();

  const me = useMe();
  const amIOwner = includesId(ownerIds, me!.id);

  // Don't show the menu at all if user is not an owner
  if (!amIOwner) {
    return null;
  }

  const manageTrustedDomains = Paths.companyAdminManageTrustedDomainsPath();
  const manageAdmins = Paths.companyManageAdminsPath();

  return (
    <Paper.Section title="As an owner, you can:">
      <div>
        <OptionsMenuItem linkTo={manageAdmins} icon={Icons.IconShieldLock} title="Manage administrators and owners" />
        <OptionsMenuItem linkTo={manageTrustedDomains} icon={Icons.IconLock} title="Manage trusted email domains" />
      </div>
    </Paper.Section>
  );
}
