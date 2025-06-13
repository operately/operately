import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Hub from "@/features/ResourceHub";

import { assertPresent } from "@/utils/assertions";
import { useLoadedData } from "./loader";

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
  const { resourceHub } = useLoadedData();

  assertPresent(resourceHub.space, "space must be present in resourceHub");

  return (
    <Paper.Navigation
      testId="navigation"
      items={[
        { to: DeprecatedPaths.spacePath(resourceHub.space.id!), label: resourceHub.space.name! },
        { to: DeprecatedPaths.resourceHubPath(resourceHub.id!), label: resourceHub.name! },
      ]}
    />
  );
}
