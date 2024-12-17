import React, { useMemo } from "react";

import * as Hub from "@/models/resourceHubs";

import Modal from "@/components/Modal";
import Forms from "@/components/Forms";
import { MenuActionItem } from "@/components/Menu";
import { createTestId } from "@/utils/testid";
import { compareIds } from "@/routes/paths";

import { useNodesContext } from "../contexts/NodesContext";
import { FolderSelectField } from "./FolderSelectField";

export function MoveResourceMenuItem({ resource }: { resource: Hub.ResourceHubFile }) {
  const { setLocationEditingNodeId } = useNodesContext();
  const testId = createTestId("move-resource", resource.id!);

  return (
    <MenuActionItem onClick={() => setLocationEditingNodeId(resource.id!)} testId={testId}>
      Move
    </MenuActionItem>
  );
}

interface FormProps {
  resource: Hub.ResourceHubFile;
  resourceType: "file";
}

export function MoveResourceModal({ resource, resourceType }: FormProps) {
  const { parent, locationEditingNodeId, setLocationEditingNodeId, refetch } = useNodesContext();
  const isOpen = useMemo(() => compareIds(locationEditingNodeId, resource.id), [locationEditingNodeId]);
  const [edit] = Hub.useEditParentFolderInResourceHub();

  const hideModal = () => setLocationEditingNodeId(undefined);
  const locationChanged = () => {
    if (!resource.parentFolderId && !form.values.newFolderId) return false;
    if (resource.parentFolderId === form.values.newFolderId) return false;
    return true;
  };

  const form = Forms.useForm({
    fields: {
      newFolderId: "pathToFolder" in parent ? parent.id : null,
    },
    cancel: hideModal,
    submit: async () => {
      if (locationChanged()) {
        await edit({
          newFolderId: form.values.newFolderId,
          resourceId: resource.id,
          resourceType: resourceType,
        });

        refetch();
      }

      hideModal();
      form.actions.reset();
    },
  });

  return (
    <Modal title={`Move “${resource.name}”`} isOpen={isOpen} hideModal={hideModal}>
      <Forms.Form form={form}>
        <Forms.FieldGroup>
          <FolderSelectField field="newFolderId" startLocation={parent} />
        </Forms.FieldGroup>

        <Forms.Submit saveText="Move" cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}
