import React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { Paths } from "@/routes/paths";
import { Form } from "./form";
import { useLoadedData } from "./loader";

export function Page() {
  const { document } = useLoadedData();

  return (
    <Pages.Page title="New Document">
      <Paper.Root>
        <Navigation />
        <Paper.Body>
          <Form document={document} />
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
