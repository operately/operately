import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { Paths } from "@/routes/paths";
import { useLoadedData } from "./loader";
import { Form } from "./form";

export function Page() {
  return (
    <Pages.Page title="Copy Document">
      <Paper.Root>
        <Navigation />
        <Paper.Body>
          <Form />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation() {
  const { document } = useLoadedData();

  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.resourceHubDocumentPath(document.id!)}>{document.name}</Paper.NavItem>
    </Paper.Navigation>
  );
}
