import * as React from "react";

import { useResourceHubNodesListContext } from "../contexts/NodesListContext";
import type { ResourceHubFolderMenuData } from "../types";
import { CopyResourceModal } from "./CopyResource";

interface CopyFolderModalProps {
  resource: ResourceHubFolderMenuData;
  isOpen: boolean;
  hideModal: () => void;
}

export function CopyFolderModal({ resource, isOpen, hideModal }: CopyFolderModalProps) {
  const { parent, actions, forms } = useResourceHubNodesListContext();

  const form = forms.useForm({
    fields: {
      name: resource.name + " - Copy",
      location: {
        id: parent.id,
        type: parent.type === "folder" ? "folder" : "resourceHub",
      },
    },
    cancel: hideModal,
    submit: async () => {
      const location = form.values.location as { id?: string | null; type: "folder" | "resourceHub" };

      await actions.copyFolder({
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
