import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { Paths } from "@/routes/paths";
import { useLoadedData } from "./loader";
import { Form } from "./form";

export function Page() {
  const { file } = useLoadedData();

  return (
    <Pages.Page title="Edit File">
      <Paper.Root>
        <Navigation />
        <Paper.Body>
          <Form file={file} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation() {
  const { file } = useLoadedData();

  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.resourceHubFilePath(file.id!)}>{file.name}</Paper.NavItem>
    </Paper.Navigation>
  );
}
