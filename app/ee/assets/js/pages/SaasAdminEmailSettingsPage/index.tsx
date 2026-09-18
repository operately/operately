import { useLoadedData } from "./loader";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as React from "react";

import { EmailSettingsSection } from "./EmailSettingsSection";

export { loader } from "./loader";

export function Page() {
  const { emailSettings } = useLoadedData();

  return (
    <Pages.Page title="Email Configuration" testId="saas-admin-email-settings-page">
      <Paper.Root size="large">
        <Paper.Navigation items={[{ to: "/admin", label: "Administration" }]} />
        <Paper.Body>
          <Paper.Header title="Email Configuration" />
          <EmailSettingsSection initialSettings={emailSettings} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
