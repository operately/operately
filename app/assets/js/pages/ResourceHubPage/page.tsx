import React from "react";

import { ResourceHubPage } from "turboui";
import {
  folders,
  getDraftEditPath,
  useAddFileWidgetProps,
  useNewFileModalsContextValue,
  useResourceHubNodesListProps,
} from "@/models/resourceHubs";

import { usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { useLoadedData, useRefresh } from "./loader";
import Forms from "@/components/Forms";
import Modal from "@/components/Modal";
import type { ResourceHubFormsApi } from "turboui";

export function Page() {
  const { resourceHub, nodes, draftNodes } = useLoadedData();
  const refresh = useRefresh();
  const paths = usePaths();

  assertPresent(resourceHub.permissions, "permissions must be present in resourceHub");
  assertPresent(resourceHub.space, "space must be present in resourceHub");

  const newFileModalsContext = useNewFileModalsContextValue({ resourceHub });
  const addFileWidgetProps = useAddFileWidgetProps({ resourceHub, onUploaded: refresh });
  const [createFolder] = folders.useCreate();
  const nodesListProps = useResourceHubNodesListProps({ resourceHub, type: "resource_hub", nodes, refetch: refresh });

  const props: ResourceHubPage.Props = {
    title: resourceHub.name || "Resource Hub",
    navigation: [{ to: paths.spacePath(resourceHub.space.id!), label: resourceHub.space.name! }],
    resourceHub,
    drafts: {
      nodes: draftNodes,
      draftsPath: paths.resourceHubDraftsPath(resourceHub.id!),
      getDraftEditPath: (node) => getDraftEditPath(paths, node),
    },
    newFileModals: newFileModalsContext,
    addFileWidgetProps,
    nodesListProps,
    addFolderModalProps: {
      resourceHubId: resourceHub.id!,
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

  return <ResourceHubPage {...props} />;
}
