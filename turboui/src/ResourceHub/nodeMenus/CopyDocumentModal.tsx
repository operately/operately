import * as React from "react";

import * as Forms from "../../Forms";
import {
  ResourceHubNodesListProvider,
  useResourceHubNodesListContext,
  type ResourceHubNodesListContextValue,
} from "../contexts/NodesListContext";
import { getResourceName } from "../selectors";
import type { ResourceHubDocument } from "../types";
import { CopyResourceModal } from "./CopyResource";

interface CopyDocumentModalProps {
  resource: ResourceHubDocument;
  isOpen: boolean;
  hideModal: () => void;
}

export function CopyDocumentModal({ resource, isOpen, hideModal }: CopyDocumentModalProps) {
  const { parent, actions } = useResourceHubNodesListContext();

  const form = Forms.useForm({
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
  document: ResourceHubDocument;
  isOpen: boolean;
  hideModal: () => void;
}

export function CopyDocumentModalWrapper({
  listContext,
  document,
  isOpen,
  hideModal,
}: CopyDocumentModalWrapperProps) {
  return (
    <ResourceHubNodesListProvider value={listContext}>
      <CopyDocumentModal resource={document} isOpen={isOpen} hideModal={hideModal} />
    </ResourceHubNodesListProvider>
  );
}
