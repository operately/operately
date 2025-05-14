import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { PageNavigation } from "@/features/accounts/PageNavigation";
import { Link } from "turboui";

import { Paths } from "@/routes/paths";
import { PageModule } from "@/routes/types";

export default { name: "AccountSecurityPage", loader: Pages.emptyLoader, Page } as PageModule;

function Page() {
  return (
    <Pages.Page title={"Password & Security"} testId="account-security-page">
      <Paper.Root size="small">
        <PageNavigation />
        <Paper.Body>
          <Paper.Header title="Password & Security" />

          <div>You are using your email and password to sign in to your account.</div>
          <Link to={Paths.accountChangePasswordPath()} testId="change-password">
            Change your password
          </Link>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
