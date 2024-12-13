import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Hub from "@/features/ResourceHub";

import { useLoadedData, useRefresh } from "./loader";
import { assertPresent } from "@/utils/assertions";
import { Paths } from "@/routes/paths";
import { truncateString } from "@/utils/strings";

export function Page() {
  const { folder } = useLoadedData();
  const refresh = useRefresh();

  assertPresent(folder.nodes, "nodes must be present in folder");
  assertPresent(folder.resourceHub, "resourceHub must be present in folder");
  assertPresent(folder.permissions, "permissions must be present in folder");

  return (
    <Pages.Page title={folder.name!}>
      <Hub.NewFileModalsProvider folder={folder} resourceHub={folder.resourceHub}>
        <Hub.FileDragAndDropArea>
          <Paper.Root>
            <PageNavigation />

            <Paper.Body minHeight="75vh">
              <Paper.Header
                actions={<Hub.AddFilesButton permissions={folder.permissions} />}
                title={folder.name!}
                layout="title-center-actions-left"
              />

              <Hub.NodesList nodes={folder.nodes} permissions={folder.permissions} refetch={refresh} />

              <Hub.AddFolderModal folder={folder} resourceHub={folder.resourceHub} refresh={refresh} />
              <Hub.AddFileModal folder={folder} resourceHub={folder.resourceHub} refresh={refresh} />
            </Paper.Body>
          </Paper.Root>
        </Hub.FileDragAndDropArea>
      </Hub.NewFileModalsProvider>
    </Pages.Page>
  );
}

function PageNavigation() {
  const { folder } = useLoadedData();

  assertPresent(folder.resourceHub, "resourceHub must be present in folder");
  assertPresent(folder.pathToFolder, "pathToFolder must be present in folder");

  return (
    <Paper.Navigation testId="navigation">
      <Paper.NavItem linkTo={Paths.resourceHubPath(folder.resourceHub.id!)}>{folder.resourceHub.name}</Paper.NavItem>
      {folder.pathToFolder.map((folder) => (
        <React.Fragment key={folder.id}>
          <Paper.NavSeparator />
          <Paper.NavItem linkTo={Paths.resourceHubFolderPath(folder.id!)}>
            {truncateString(folder.name!, 20)}
          </Paper.NavItem>
        </React.Fragment>
      ))}
    </Paper.Navigation>
  );
}
