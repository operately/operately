import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { Form } from "./form";
import { useLoadedData } from "./loader";

export function Page() {
  return (
    <Pages.Page title="New Document">
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
  const { resourceHub } = useLoadedData();

  assertPresent(resourceHub.space, "space must be present in resourceHub");

  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.spacePath(resourceHub.space.id!)}>{resourceHub.space.name}</Paper.NavItem>
      <Paper.NavSeparator />
      <Paper.NavItem linkTo={Paths.resourceHubPath(resourceHub.id!)}>{resourceHub.name}</Paper.NavItem>
    </Paper.Navigation>
  );
}
