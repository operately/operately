import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Hub from "@/features/ResourceHub";

import { DeprecatedPaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { useLoadedData, useRefresh } from "./loader";

export function Page() {
  const { resourceHub, nodes, draftNodes } = useLoadedData();
  const refresh = useRefresh();

  assertPresent(resourceHub.permissions, "permissions must be present in resourceHub");

  return (
    <Pages.Page title={resourceHub.name!}>
      <Hub.NewFileModalsProvider resourceHub={resourceHub}>
        <Hub.FileDragAndDropArea>
          <Paper.Root size="large">
            <PageNavigation />

            <Paper.Body minHeight="75vh">
              <Hub.Header resource={resourceHub} />
              <Hub.ContinueEditingDrafts resourceHubId={resourceHub.id!} drafts={draftNodes} />
              <Hub.AddFileWidget resourceHub={resourceHub} refresh={refresh} />
              <Hub.NodesList resourceHub={resourceHub} type="resource_hub" nodes={nodes} refetch={refresh} />
              <Hub.AddFolderModal resourceHub={resourceHub} refresh={refresh} />
            </Paper.Body>
          </Paper.Root>
        </Hub.FileDragAndDropArea>
      </Hub.NewFileModalsProvider>
    </Pages.Page>
  );
}

function PageNavigation() {
  const { resourceHub } = useLoadedData();

  assertPresent(resourceHub.space, "space must be present in resourceHub");

  return (
    <Paper.Navigation
      testId="navigation"
      items={[{ to: DeprecatedPaths.spacePath(resourceHub.space.id!), label: resourceHub.space.name! }]}
    />
  );
}
