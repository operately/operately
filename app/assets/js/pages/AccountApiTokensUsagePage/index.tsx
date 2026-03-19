import React from "react";

import * as Pages from "@/components/Pages";
import { PageModule } from "@/routes/types";
import { usePaths } from "@/routes/paths";
import { AccountApiTokensUsagePage } from "turboui";

export default { name: "AccountApiTokensUsagePage", loader: Pages.emptyLoader, Page } as PageModule;

function Page() {
  const paths = usePaths();
  const baseUrl = normalizeBaseUrl(window.appConfig.baseUrl || window.location.origin);

  return (
    <AccountApiTokensUsagePage
      homePath={paths.homePath()}
      securityPath={paths.accountSecurityPath()}
      apiTokensPath={paths.accountApiTokensPath()}
      baseUrl={baseUrl}
      externalBasePath="/api/external/v1"
    />
  );
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}
