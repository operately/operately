import React from "react";
import { useLocation } from "react-router-dom";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { Form } from "./form";
import { useLoadedData } from "./loader";

export function Page() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const folderId = params.get("folderId");

  return (
    <Pages.Page title="New Document">
      <Paper.Root>
        <Navigation />
        <Paper.Body>
          <Form folderId={folderId} />
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