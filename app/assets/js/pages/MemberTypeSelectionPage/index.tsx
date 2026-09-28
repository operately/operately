import React from "react";
import { useTranslation } from "react-i18next";

import { loader, useLoadedData } from "./loader";
import { MemberTypeSelectionPage } from "turboui";
import { PageModule } from "@/routes/types";
import { usePaths } from "@/routes/paths";

export default { name: "MemberTypeSelectionPage", loader, Page } as PageModule;

function Page() {
  const { t } = useTranslation();
  const paths = usePaths();
  const { company } = useLoadedData();
  const navigationItems = React.useMemo(
    () => [
      { to: paths.companyAdminPath(), label: t("Company Administration") },
      { to: paths.companyManagePeoplePath(), label: t("Manage Team Members") },
    ],
    [paths, t],
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
