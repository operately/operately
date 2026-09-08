import React from "react";

import { ResourceHubPage } from "turboui";
import {
  getDraftEditPath,
  useAddFileWidgetProps,
  useNewFileModalsContextValue,
  useResourceHubNodesListProps,
  useCreateFolder,
} from "@/models/resourceHubs";
import { useResourceHubSearchProps } from "@/models/search/resourceHub";

import { usePaths } from "@/routes/paths";
import { useLoadedData, useRefresh } from "./loader";
import { buildResourceHubPageNavigation } from "./navigation";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";

export function Page() {
  const { resourceHub, nodes, draftNodes } = useLoadedData();
  const refresh = useRefresh();
  const paths = usePaths();
  const search = useResourceHubSearchProps(resourceHub.id);
  const formattedTimePreferences = useFormattedTimePreferences();

  const newFileModalsContext = useNewFileModalsContextValue({ resourceHub });
  const addFileWidgetProps = useAddFileWidgetProps({ resourceHub, onUploaded: refresh });
  const { mutateAsync: createFolder } = useCreateFolder();
  const nodesListProps = useResourceHubNodesListProps({ resourceHub, type: "resource_hub", nodes, refetch: refresh });

  const props: ResourceHubPage.Props = {
    title: resourceHub.name || "Resource Hub",
    navigation: buildResourceHubPageNavigation(resourceHub, paths),
    resourceHub,
    drafts: {
      nodes: draftNodes,
      draftsPath: paths.resourceHubDraftsPath(resourceHub.id!),
      getDraftEditPath: (node) => getDraftEditPath(paths, node),
    },
    newFileModals: newFileModalsContext,
    addFileWidgetProps,
    nodesListProps,
    search,
    formattedTimePreferences,
    addFolderModalProps: {
      resourceHubId: resourceHub.id!,
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

  return <ResourceHubPage {...props} />;
}
