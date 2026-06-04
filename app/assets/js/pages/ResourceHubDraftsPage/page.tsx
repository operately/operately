import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Hub from "@/features/ResourceHub";

import { useLoadedData } from "./loader";

import { usePaths } from "@/routes/paths";
export function Page() {
  const { resourceHub, draftNodes } = useLoadedData();

  return (
    <Pages.Page title={["Drafts", resourceHub.name!]}>
      <Paper.Root size="large">
        <PageNavigation />

        <Paper.Body minHeight="75vh">
          <Paper.Header title="Your Drafts" layout="title-center-actions-left" underline />
          <Hub.DraftNodesList nodes={draftNodes} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function PageNavigation() {
  const paths = usePaths();
  const { resourceHub } = useLoadedData();

  return (
    <Paper.Navigation
      testId="navigation"
      items={[
        Hub.resourceHubParentItem(paths, resourceHub),
        { to: paths.resourceHubPath(resourceHub.id!), label: resourceHub.name! },
      ]}
    />
  );
}
