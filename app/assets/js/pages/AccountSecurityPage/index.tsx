import * as Pages from "@/components/Pages";
import * as React from "react";

import { AccountSecurityPage } from "turboui";

import { PageModule } from "@/routes/types";
import { usePaths } from "@/routes/paths";

export default { name: "AccountSecurityPage", loader: Pages.emptyLoader, Page } as PageModule;

function Page() {
  const paths = usePaths();

  return (
    <AccountSecurityPage
      homePath={paths.homePath()}
      changePasswordPath={paths.accountChangePasswordPath()}
      apiTokensPath={paths.accountApiTokensPath()}
      mcpConnectionsPath={paths.accountMcpConnectionsPath()}
    />
  );
}
