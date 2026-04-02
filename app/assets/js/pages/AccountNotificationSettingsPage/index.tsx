import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as React from "react";

import { PageNavigation } from "@/features/accounts/PageNavigation";
import { Paths } from "@/routes/paths";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectUtils";
import { PageModule } from "@/routes/types";

export default { name: "AccountNotificationSettingsPage", loader, Page } as PageModule;

async function loader({ params }) {
  await redirectIfFeatureNotEnabled(params, {
    feature: "buffered_notifications",
    path: new Paths({ companyId: params.companyId! }).homePath(),
  });

  return null;
}

function Page() {
  return (
    <Pages.Page title={"Notification Settings"} testId="account-notification-settings-page">
      <Paper.Root size="small">
        <PageNavigation />
        <Paper.Body>
          <Paper.Header title="Notification settings" />

          <div>Notification email preferences will be configured here.</div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
