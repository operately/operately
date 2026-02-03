import React from "react";

import { MemberTypeSelectionPage } from "turboui";
import { PageModule } from "@/routes/types";
import { usePaths } from "@/routes/paths";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";
import * as Pages from "@/components/Pages";

export default { name: "MemberTypeSelectionPage", loader: Pages.emptyLoader, Page } as PageModule;

function Page() {
  const paths = usePaths();
  const data = useCompanyLoaderData();
  const company = data?.company;
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
