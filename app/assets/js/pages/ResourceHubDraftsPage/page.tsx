import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import { DraftNodesList } from "turboui";
import { draftNodeToUiNode } from "@/features/ResourceHub/turbouiAdapters";

import { assertPresent } from "@/utils/assertions";
import { useLoadedData } from "./loader";

import { usePaths } from "@/routes/paths";
export function Page() {
  const { resourceHub, draftNodes } = useLoadedData();
  const paths = usePaths();
  const draftUiNodes = draftNodes.map((node) => draftNodeToUiNode(paths, node));

  return (
    <Pages.Page title={["Drafts", resourceHub.name!]}>
      <Paper.Root size="large">
        <PageNavigation />

        <Paper.Body minHeight="75vh">
          <Paper.Header title="Your Drafts" layout="title-center-actions-left" underline />
          <DraftNodesList nodes={draftUiNodes} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function PageNavigation() {
  const paths = usePaths();
  const { resourceHub } = useLoadedData();

  assertPresent(resourceHub.space, "space must be present in resourceHub");

  return (
    <Paper.Navigation
      testId="navigation"
      items={[
        { to: paths.spacePath(resourceHub.space.id!), label: resourceHub.space.name! },
        { to: paths.resourceHubPath(resourceHub.id!), label: resourceHub.name! },
      ]}
    />
  );
}
