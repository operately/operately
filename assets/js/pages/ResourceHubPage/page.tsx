import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { Paths } from "@/routes/paths";
import { useLoadedData, useRefresh } from "./loader";
import { assertPresent } from "@/utils/assertions";
import { AddFilesButtonAndForms, NodesList, ZeroNodes } from "@/features/ResourceHub";

export function Page() {
  const { resourceHub } = useLoadedData();
  const refresh = useRefresh();

  assertPresent(resourceHub.nodes, "nodes must be present in resourceHub");

  return (
    <Pages.Page title={resourceHub.name!}>
      <Paper.Root>
        <PageNavigation />

        <Paper.Body minHeight="75vh">
          <Paper.Header
            actions={<AddFilesButtonAndForms resourceHub={resourceHub} refresh={refresh} />}
            title={resourceHub.name!}
            layout="title-center-actions-left"
          />

          {resourceHub.nodes.length < 1 ? <ZeroNodes /> : <NodesList nodes={resourceHub.nodes} />}
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function PageNavigation() {
  const { resourceHub } = useLoadedData();

  assertPresent(resourceHub.space, "space must be present in resourceHub");

  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.spacePath(resourceHub.space.id!)}>{resourceHub.space.name}</Paper.NavItem>
    </Paper.Navigation>
  );
}
