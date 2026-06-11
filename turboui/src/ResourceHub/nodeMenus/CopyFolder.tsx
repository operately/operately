import * as React from "react";

import { useResourceHubNodesListContext } from "../contexts/NodesListContext";
import { getResourceName } from "../selectors";
import type { ResourceHubFolder } from "../types";
import { CopyResourceModal } from "./CopyResource";

interface CopyFolderModalProps {
  resource: ResourceHubFolder;
  isOpen: boolean;
  hideModal: () => void;
}

export function CopyFolderModal({ resource, isOpen, hideModal }: CopyFolderModalProps) {
  const { parent, actions, forms } = useResourceHubNodesListContext();

  const form = forms.useForm({
    fields: {
      name: `${getResourceName(resource)} - Copy`,
      location: {
        id: parent.id,
        type: parent.type === "folder" ? "folder" : "resourceHub",
      },
    },
    cancel: hideModal,
    submit: async () => {
      const location = form.values.location as { id?: string | null; type: "folder" | "resourceHub" };
      const copyFolder = actions.copyFolder;

      if (!copyFolder) return;

      await copyFolder({
        folderId: resource.id,
        name: form.values.name as string,
        resourceHubId: resource.resourceHubId,
        location,
      });

      hideModal();
    },
  });

  return <CopyResourceModal form={form} resource={resource} isOpen={isOpen} hideModal={hideModal} />;
}
