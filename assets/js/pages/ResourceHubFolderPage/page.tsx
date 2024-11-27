import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { useLoadedData, useRefresh } from "./loader";
import { assertPresent } from "@/utils/assertions";
import { AddFilesButtonAndForms, NodesList, ZeroNodes } from "@/features/ResourceHub";
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
      <Paper.Root>
        <PageNavigation />

        <Paper.Body minHeight="75vh">
          <Paper.Header
            actions={
              <AddFilesButtonAndForms resourceHub={folder.resourceHub} refresh={refresh} folderId={folder.id!} />
            }
            title={folder.name!}
            layout="title-center-actions-left"
          />

          {folder.nodes.length < 1 ? (
            <ZeroNodes />
          ) : (
            <NodesList nodes={folder.nodes} permissions={folder.permissions} refetch={refresh} />
          )}
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function PageNavigation() {
  const { folder } = useLoadedData();

  assertPresent(folder.resourceHub, "resourceHub must be present in folder");
  assertPresent(folder.pathToFolder, "pathToFolder must be present in folder");

  return (
    <Paper.Navigation>
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
