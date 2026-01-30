import React from "react";

import * as Companies from "@/models/companies";
import * as Pages from "@/components/Pages";
import { MemberTypeSelectionPage } from "turboui";
import { PageModule } from "@/routes/types";
import { usePaths } from "@/routes/paths";
import { useRouteLoaderData } from "react-router-dom";

export default { name: "MemberTypeSelectionPage", loader: Pages.emptyLoader, Page } as PageModule;

function Page() {
  const paths = usePaths();
  const data = useRouteLoaderData("companyRoot") as { company?: Companies.Company } | null;
  const company = data?.company;
  const showOutsideCollaborator = company ? Companies.hasFeature(company, "guest-accounts") : false;
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
      showOutsideCollaborator={showOutsideCollaborator}
      testId="member-type-selection-page"
    />
  );
}
