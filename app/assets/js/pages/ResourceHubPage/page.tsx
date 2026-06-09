import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Hub from "@/features/ResourceHub";
import { ContinueEditingDrafts, Header as ResourceHubHeader } from "turboui";
import { draftNodeToUiNode } from "@/features/ResourceHub/turbouiAdapters";

import { usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { useLoadedData, useRefresh } from "./loader";

export function Page() {
  const { resourceHub, nodes, draftNodes } = useLoadedData();
  const refresh = useRefresh();
  const paths = usePaths();
  const draftUiNodes = draftNodes.map((node) => draftNodeToUiNode(paths, node));

  assertPresent(resourceHub.permissions, "permissions must be present in resourceHub");

  return (
    <Pages.Page title={resourceHub.name!}>
      <Hub.NewFileModalsProvider resourceHub={resourceHub}>
        <Hub.FileDragAndDropArea>
          <Paper.Root size="large">
            <PageNavigation />

            <Paper.Body minHeight="75vh">
              <ResourceHubHeader
                title={resourceHub.name!}
                actions={<Hub.AddFilesButton permissions={resourceHub.permissions!} />}
              />
              <ContinueEditingDrafts drafts={draftUiNodes} draftsPath={paths.resourceHubDraftsPath(resourceHub.id!)} />
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
  const paths = usePaths();

  assertPresent(resourceHub.space, "space must be present in resourceHub");

  return (
    <Paper.Navigation
      testId="navigation"
      items={[{ to: paths.spacePath(resourceHub.space.id!), label: resourceHub.space.name! }]}
    />
  );
}
