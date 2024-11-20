import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

export const loader = Pages.emptyLoader;

export function Page() {
  return (
    <Pages.Page title={"Admininstration"} testId="saas-admin-page">
      <Paper.Root size="large">
        <Paper.Body minHeight="none">Hello, world!</Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
