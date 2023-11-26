import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { useLoadedData } from "./loader";

export function Page() {
  const { company } = useLoadedData();

  return (
    <Pages.Page title={[company.name, "Admininstration"]}>
      <Paper.Root size="small">
        <Paper.Body minHeight="none">
          <div className="uppercase text-sm text-content-dimmed">Company Admininstration</div>
          <div className="text-content-accent text-3xl font-extrabold">{company.name}</div>

          <div className="text-content-accent font-bold mt-8 text-lg">What's this?</div>
          <p>
            This is the company administration page where owners and admins can manage the company's settings. They have
            special permissions to add or remove people, change who can access the applicacation, and more. If you need
            something done, contact one of them.
          </p>

          <div className="text-content-accent font-bold mt-8 text-lg">Administrators</div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
