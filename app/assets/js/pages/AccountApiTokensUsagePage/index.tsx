import React from "react";

import { PageModule } from "@/routes/types";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectUtils";
import { Paths, usePaths } from "@/routes/paths";
import { AccountApiTokensUsagePage } from "turboui";

export default { name: "AccountApiTokensUsagePage", loader, Page } as PageModule;

async function loader({ params }): Promise<{}> {
  const paths = new Paths({ companyId: params.companyId! });

  await redirectIfFeatureNotEnabled(params, {
    feature: "api-tokens",
    path: paths.homePath(),
  });

  return {};
}

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
