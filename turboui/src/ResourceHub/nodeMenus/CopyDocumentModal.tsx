import * as React from "react";

import { useResourceHubNodesListContext } from "../contexts/NodesListContext";
import type { ResourceHubDocumentMenuData } from "../types";
import { CopyResourceModal } from "./CopyResource";

interface CopyDocumentModalProps {
  resource: ResourceHubDocumentMenuData;
  isOpen: boolean;
  hideModal: () => void;
}

export function CopyDocumentModal({ resource, isOpen, hideModal }: CopyDocumentModalProps) {
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

      await actions.copyDocument({
        documentId: resource.id,
        name: form.values.name as string,
        content: resource.content,
        resourceHubId: resource.resourceHubId,
        location,
      });

      hideModal();
    },
  });

  return <CopyResourceModal form={form} resource={resource} isOpen={isOpen} hideModal={hideModal} />;
}
