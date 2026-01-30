import React from "react";

import * as Companies from "@/models/companies";
import { MemberTypeSelectionPage } from "turboui";
import { PageModule } from "@/routes/types";
import { Paths, usePaths } from "@/routes/paths";
import { useRouteLoaderData } from "react-router-dom";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectIfFeatureEnabled";

export default { name: "MemberTypeSelectionPage", loader, Page } as PageModule;

async function loader({ params }) {
  const paths = new Paths({ companyId: params.companyId });

  await redirectIfFeatureNotEnabled(params, { feature: "guest-accounts", path: paths.inviteTeamPath() });

  return {};
}

function Page() {
  const paths = usePaths();
  const data = useRouteLoaderData("companyRoot") as { company?: Companies.Company } | null;
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
