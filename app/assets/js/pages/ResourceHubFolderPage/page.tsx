import React from "react";

import { assertPresent } from "@/utils/assertions";
import { useLoadedData, useRefresh } from "./loader";

import { ResourceHubFolderPage } from "turboui";
import {
  useAddFileWidgetProps,
  useNewFileModalsContextValue,
  useResourceHubNodesListProps,
  useCreateFolder,
  useRenameFolder,
} from "@/models/resourceHubs";
import { buildFolderPageNavigation } from "./navigation";
import { usePaths } from "@/routes/paths";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";

export function Page() {
  const { folder, nodes, draftNodes } = useLoadedData();
  const refresh = useRefresh();
  const paths = usePaths();
  const formattedTimePreferences = useFormattedTimePreferences();

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
  const mutationScope = { spaceId: folder.resourceHub.space?.id, resourceHubId: folder.resourceHub.id, parentFolderId: folder.parentFolderId };

  const { mutateAsync: createFolder } = useCreateFolder(mutationScope);
  const { mutateAsync: renameFolder } = useRenameFolder(mutationScope);
  const nodesListProps = useResourceHubNodesListProps({ folder, nodes, type: "folder", refetch: refresh });

  const props: ResourceHubFolderPage.Props = {
    title: folder.name || "Folder",
    navigation: buildFolderPageNavigation(folder, paths),
    folder,
    drafts: { nodes: draftNodes, draftsPath: paths.resourceHubDraftsPath(folder.resourceHub.id) },
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
      resourceHubId: folder.resourceHub.id,
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
    formattedTimePreferences,
  };

  return <ResourceHubFolderPage {...props} />;
}
