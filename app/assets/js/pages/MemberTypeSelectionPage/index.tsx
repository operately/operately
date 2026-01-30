import React from "react";

import { MemberTypeSelectionPage } from "turboui";
import { PageModule } from "@/routes/types";
import { Paths, usePaths } from "@/routes/paths";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectIfFeatureEnabled";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";

export default { name: "MemberTypeSelectionPage", loader, Page } as PageModule;

async function loader({ params }) {
  const paths = new Paths({ companyId: params.companyId });

  await redirectIfFeatureNotEnabled(params, { feature: "guest-accounts", path: paths.inviteTeamPath() });

  return {};
}

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
