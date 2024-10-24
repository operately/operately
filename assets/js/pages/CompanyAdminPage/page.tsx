import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Icons from "@tabler/icons-react";

import { NavigationBackToLobby } from "./NavigationBackToLobby";
import { CompanyAdmins, CompanyOwners } from "./CompanyAdmins";
import { useLoadedData } from "./loader";
import { OptionsMenu, OptionsMenuItem } from "./OptionsMenu";
import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { Link } from "@/components/Link";

export function Page() {
  const { company } = useLoadedData();

  return (
    <Pages.Page title={[company.name!, "Admininstration"]}>
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

          <Menu />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Menu() {
  const { company } = useLoadedData();

  const manageTrustedDomains = Paths.companyAdminManageTrustedDomainsPath();
  const manageAdmins = Paths.companyManageAdminsPath();
  const managePeople = Paths.companyManagePeoplePath();

  assertPresent(company.permissions, "company permissions must be present");
  const permissions = company.permissions;

  return (
    <div className="mt-12">
      <div>
        <p className="mt-12 mb-2 font-bold">As an admin, you can:</p>
        <OptionsMenuItem
          disabled={!permissions.canInviteMembers}
          linkTo={managePeople}
          icon={Icons.IconUsers}
          title="Manage Team Members"
        />
      </div>

      <div>
        <p className="mt-12 mb-2 font-bold">Reach out to an account owner if you need to:</p>

        <OptionsMenuItem
          disabled={!permissions.canManageAdmins}
          linkTo={manageAdmins}
          icon={Icons.IconShieldLock}
          title="Manage Administrators and Owners"
        />

        <OptionsMenuItem
          disabled={!permissions.canEditTrustedEmailDomains}
          linkTo={manageTrustedDomains}
          icon={Icons.IconLock}
          title="Manage Trusted Email Domains"
        />
      </div>
    </div>
  );
}
