import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as React from "react";

import { PageNavigation } from "@/features/accounts/PageNavigation";
import { Link } from "turboui";

import { Paths } from "@/routes/paths";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectUtils";
import { PageModule } from "@/routes/types";
import { usePaths } from "@/routes/paths";
export default { name: "AccountSettingsPage", loader, Page } as PageModule;

async function loader({ params }) {
  await redirectIfFeatureNotEnabled(params, {
    feature: "buffered_notifications",
    path: new Paths({ companyId: params.companyId! }).homePath(),
  });

  return null;
}

function Page() {
  const paths = usePaths();

  return (
    <Pages.Page title={"Settings"} testId="account-settings-page">
      <Paper.Root size="small">
        <PageNavigation />
        <Paper.Body>
          <Paper.Header title="Settings" />

          <div>Manage the account settings available to you.</div>

          <div className="mt-8">Adjust how Operately looks for you.</div>
          <Link to={paths.accountAppearancePath()} testId="settings-appearance-link">
            Appearance
          </Link>

          <div className="mt-8">Configure how activity and summary emails are delivered.</div>
          <Link to={paths.accountNotificationSettingsPath()} testId="notification-settings-link">
            Notification settings
          </Link>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
