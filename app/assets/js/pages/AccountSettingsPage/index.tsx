import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as React from "react";
import { IconBell, IconPalette, OptionsMenuItem } from "turboui";

import { PageNavigation } from "@/features/accounts/PageNavigation";

import { PageModule } from "@/routes/types";
import { usePaths } from "@/routes/paths";

export default { name: "AccountSettingsPage", loader: Pages.emptyLoader, Page } as PageModule;

function Page() {
  const paths = usePaths();

  return (
    <Pages.Page title={"Settings"} testId="account-settings-page">
      <Paper.Root size="small">
        <PageNavigation />
        <Paper.Body minHeight="none">
          <div className="mb-2 text-content-accent text-3xl font-extrabold">Settings</div>
          <p className="mb-8">Manage the account settings available to you.</p>

          <OptionsMenuItem
            linkTo={paths.accountAppearancePath()}
            icon={IconPalette}
            title="Appearance"
            description="Adjust how Operately looks for you"
          />
          <OptionsMenuItem
            linkTo={paths.accountNotificationSettingsPath()}
            icon={IconBell}
            title="Notification settings"
            description="Configure how activity and summary emails are delivered"
          />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
