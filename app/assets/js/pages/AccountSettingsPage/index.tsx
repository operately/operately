import * as Pages from "@/components/Pages";
import * as React from "react";

import { AccountSettingsPage } from "turboui";

import { PageModule } from "@/routes/types";
import { usePaths } from "@/routes/paths";

export default { name: "AccountSettingsPage", loader: Pages.emptyLoader, Page } as PageModule;

function Page() {
  const paths = usePaths();

  return (
    <AccountSettingsPage
      homePath={paths.homePath()}
      appearancePath={paths.accountAppearancePath()}
      notificationSettingsPath={paths.accountNotificationSettingsPath()}
    />
  );
}
