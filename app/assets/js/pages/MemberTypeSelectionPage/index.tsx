import React from "react";

import { loader, useLoadedData } from "./loader";
import { MemberTypeSelectionPage } from "turboui";
import { PageModule } from "@/routes/types";
import { usePaths } from "@/routes/paths";

export default { name: "MemberTypeSelectionPage", loader, Page } as PageModule;

function Page() {
  const paths = usePaths();
  const { company } = useLoadedData();
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
