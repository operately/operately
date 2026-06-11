import React from "react";

import { assertPresent } from "@/utils/assertions";
import { useLoadedData, useRefresh } from "./loader";

import { ResourceHubFolderPage } from "turboui";
import {
  folders,
  useAddFileWidgetProps,
  useNewFileModalsContextValue,
  useResourceHubNodesListProps,
} from "@/models/resourceHubs";
import { usePaths } from "@/routes/paths";
import Forms from "@/components/Forms";
import Modal from "@/components/Modal";
import type { ResourceHubFormsApi } from "turboui";

export function Page() {
  const { folder, nodes } = useLoadedData();
  const refresh = useRefresh();
  const paths = usePaths();

  assertPresent(folder.resourceHub, "resourceHub must be present in folder");
  assertPresent(folder.permissions, "permissions must be present in folder");
  assertPresent(folder.resourceHub.space, "space must be present in resourceHub");

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
  const navigation = [
    { to: paths.spacePath(folder.resourceHub.space.id!), label: folder.resourceHub.space.name! },
    { to: paths.resourceHubPath(folder.resourceHub.id!), label: folder.resourceHub.name ?? "" },
    ...(folder.pathToFolder || []).map((item) => ({
      to: paths.resourceHubFolderPath(item.id),
      label: item.name ?? "",
    })),
  ];
  const props: ResourceHubFolderPage.Props = {
    title: folder.name || "Folder",
    navigation,
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
      forms: Forms as unknown as ResourceHubFormsApi,
      modal: { Modal },
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
