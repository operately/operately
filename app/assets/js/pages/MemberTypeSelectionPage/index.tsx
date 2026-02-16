import React from "react";

import * as Pages from "@/components/Pages";
import { MemberTypeSelectionPage } from "turboui";
import { PageModule } from "@/routes/types";
import { usePaths } from "@/routes/paths";
import * as Companies from "@/models/companies";

export default { name: "MemberTypeSelectionPage", loader, Page } as PageModule;

interface LoaderResult {
  company: Companies.Company;
}

async function loader({ params }): Promise<LoaderResult> {
  const company = await Companies.getCompany({ id: params.companyId, includePermissions: true }).then(
    (res) => res.company,
  );

  if (!company.permissions?.isAdmin) {
    throw new Response("Not Found", { status: 404 });
  }

  return {
    company: company,
  };
}

function Page() {
  const paths = usePaths();
  const { company } = Pages.useLoadedData() as LoaderResult;
  const navigationItems = React.useMemo(
    () => [
      { to: paths.companyAdminPath(), label: "Company Administration" },
      { to: paths.companyManagePeoplePath(), label: "Manage Team Members" },
    ],
    [paths],
  );

  return (
    <MemberTypeSelectionPage
      companyName={company?.name || ""}
      navigationItems={navigationItems}
      teamMemberPath={paths.inviteTeamPath()}
      outsideCollaboratorPath={paths.companyManagePeopleAddPeoplePath({ memberType: "outside_collaborator" })}
      testId="member-type-selection-page"
    />
  );
}
