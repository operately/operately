import React from "react";

import { assertPresent } from "@/utils/assertions";
import { useLoadedData, useRefresh } from "./loader";

import { ResourceHubFolderPage, resourceHubFolderNavigation } from "turboui";
import {
  folders,
  resourceHubNavigationPaths,
  resourceHubWithParentContext,
  useAddFileWidgetProps,
  useNewFileModalsContextValue,
  useResourceHubNodesListProps,
} from "@/models/resourceHubs";
import { usePaths } from "@/routes/paths";

export function Page() {
  const { folder, nodes } = useLoadedData();
  const refresh = useRefresh();
  const paths = usePaths();
  const navigationFolder = {
    ...folder,
    resourceHub: resourceHubWithParentContext(folder.resourceHub, {
      space: folder.space,
      project: folder.project,
      goal: folder.goal,
    }),
  };

  assertPresent(folder.resourceHub, "resourceHub must be present in folder");
  assertPresent(folder.permissions, "permissions must be present in folder");

  const newFileModalsContext = useNewFileModalsContextValue({
    resourceHub: folder.resourceHub,
    folder,
  });
  const addFileWidgetProps = useAddFileWidgetProps({
    resourceHub: folder.resourceHub,
    folder,
    onUploaded: refresh,
  });
  const [createFolder] = folders.useCreate();
  const [renameFolder] = folders.useRename();
  const nodesListProps = useResourceHubNodesListProps({ folder, nodes, type: "folder", refetch: refresh });
  const props: ResourceHubFolderPage.Props = {
    title: folder.name || "Folder",
    navigation: resourceHubFolderNavigation(navigationFolder, resourceHubNavigationPaths(paths)),
    folder,
    renameFolder: {
      onRename: async (id, name) => {
        await renameFolder({ folderId: id, newName: name });
      },
      onSave: refresh,
    },
    newFileModals: newFileModalsContext,
    addFileWidgetProps,
    nodesListProps,
    addFolderModalProps: {
      resourceHubId: folder.resourceHub.id!,
      folderId: folder.id,
      onCreated: refresh,
      onCreateFolder: async (args) => {
        await createFolder({
          resourceHubId: args.resourceHubId,
          folderId: args.folderId,
          name: args.name,
        });
      },
    },
  };

  return <ResourceHubFolderPage {...props} />;
}
