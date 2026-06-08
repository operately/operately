import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Hub from "@/features/ResourceHub";
import { ResourceHubDocsAndFiles } from "@/features/ResourceHub/DocsAndFiles";

import { usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { useLoadedData, useRefresh } from "./loader";

export function Page() {
  const { resourceHub, nodes, draftNodes } = useLoadedData();
  const refresh = useRefresh();

  assertPresent(resourceHub.permissions, "permissions must be present in resourceHub");

  return (
    <Pages.Page title={resourceHub.name!}>
      <Paper.Root size="large">
        <PageNavigation />

        <Paper.Body minHeight="75vh">
          <ResourceHubDocsAndFiles
            resourceHub={resourceHub}
            nodes={nodes}
            draftNodes={draftNodes}
            refresh={refresh}
            className="p-0"
          />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function PageNavigation() {
  const { resourceHub } = useLoadedData();
  const paths = usePaths();

  return <Paper.Navigation testId="navigation" items={[Hub.resourceHubParentItem(paths, resourceHub)]} />;
}
