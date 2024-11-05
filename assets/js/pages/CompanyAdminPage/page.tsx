import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Icons from "@tabler/icons-react";

import { NavigationBackToLobby } from "./NavigationBackToLobby";
import { CompanyAdmins, CompanyOwners } from "./CompanyAdmins";
import { useLoadedData } from "./loader";
import { OptionsMenuItem } from "./OptionsMenu";
import { Paths, includesId } from "@/routes/paths";
import { Link } from "@/components/Link";
import { useMe } from "@/contexts/CurrentCompanyContext";

export function Page() {
  const { company } = useLoadedData();

  return (
    <Pages.Page title={[company.name!, "Admininstration"]} testId="company-admin-page">
      <Paper.Root size="small">
        <NavigationBackToLobby />

        <Paper.Body minHeight="none">
          <div className="uppercase text-sm tracking-wide">Company Admininstration</div>
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

  const managePeople = Paths.companyManagePeoplePath();
  const renameCompanyPath = Paths.companyRenamePath();

  let message = "";

  if (amIOwner) {
    message = "As an admin or owner, you can:";
  } else if (amIAdmin) {
    message = "As an admin, you can:";
  } else {
    message = "Reach out to an admin if you need to:";
  }

  return (
    <div className="mt-12">
      <div>
        <p className="mt-12 mb-2 font-bold">{message}</p>
        <OptionsMenuItem
          disabled={!(amIAdmin || amIOwner)}
          linkTo={managePeople}
          icon={Icons.IconUsers}
          title="Manage team members"
        />

        <OptionsMenuItem
          disabled={!(amIAdmin || amIOwner)}
          linkTo={renameCompanyPath}
          icon={Icons.IconLetterCase}
          title="Rename the company"
        />
      </div>
    </div>
  );
}

function OwnersMenu() {
  const { ownerIds } = useLoadedData();

  const me = useMe();
  const amIOwner = includesId(ownerIds, me!.id);

  let message = "";

  if (amIOwner) {
    message = "As an owner, you can:";
  } else {
    message = "Reach out to an account owner if you need to:";
  }

  const manageTrustedDomains = Paths.companyAdminManageTrustedDomainsPath();
  const manageAdmins = Paths.companyManageAdminsPath();

  return (
    <div className="mt-12">
      <div>
        <p className="mt-12 mb-2 font-bold">{message}</p>

        <OptionsMenuItem
          disabled={!amIOwner}
          linkTo={manageAdmins}
          icon={Icons.IconShieldLock}
          title="Manage administrators and owners"
        />

        <OptionsMenuItem
          disabled={!amIOwner}
          linkTo={manageTrustedDomains}
          icon={Icons.IconLock}
          title="Manage trusted email domains"
        />
      </div>
    </div>
  );
}
