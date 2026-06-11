import * as React from "react";

import {
  ResourceHubNodesListProvider,
  useResourceHubNodesListContext,
  type ResourceHubNodesListContextValue,
} from "../contexts/NodesListContext";
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
      const copyDocument = actions.copyDocument;

      if (!copyDocument) return;

      await copyDocument({
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

interface CopyDocumentModalWrapperProps {
  listContext: ResourceHubNodesListContextValue;
  menuResource: ResourceHubDocumentMenuData;
  isOpen: boolean;
  hideModal: () => void;
}

export function CopyDocumentModalWrapper({
  listContext,
  menuResource,
  isOpen,
  hideModal,
}: CopyDocumentModalWrapperProps) {
  return (
    <ResourceHubNodesListProvider value={listContext}>
      <CopyDocumentModal resource={menuResource} isOpen={isOpen} hideModal={hideModal} />
    </ResourceHubNodesListProvider>
  );
}
