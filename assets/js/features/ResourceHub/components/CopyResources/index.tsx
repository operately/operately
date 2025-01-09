import * as React from "react";
import * as Hub from "@/models/resourceHubs";

import { MenuActionItem } from "@/components/Menu";
import { createTestId } from "@/utils/testid";
import { useNodesContext } from "@/features/ResourceHub";

import Modal from "@/components/Modal";
import Forms from "@/components/Forms";

import { FolderSelectField } from "../MoveResources/FolderSelectField";

export type CopyableResource = Hub.ResourceHubDocument;

interface Props {
  resource: CopyableResource;
  showModal: () => void;
}

export function CopyResourceMenuItem({ resource, showModal }: Props) {
  return <MenuActionItem testId={createTestId("copy", resource.id!)} onClick={showModal} children="Copy" />;
}

export function CopyResourceModal({ resource, resourceType, isOpen, hideModal }) {
  const { parent, refetch } = useNodesContext();
  const [edit] = Hub.useEditParentFolderInResourceHub();

  const locationChanged = () => {
    if (!resource.parentFolderId && !form.values.newFolderId) return false;
    if (resource.parentFolderId === form.values.newFolderId) return false;
    return true;
  };

  const form = Forms.useForm({
    fields: {
      name: resource.name + " (copy)",
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
    <Modal title={`Copy “${resource.name}”`} isOpen={true} hideModal={hideModal}>
      <Forms.Form form={form}>
        <Forms.FieldGroup>
          <Forms.TextInput label="Name of the copy" field="name" />

          <FolderSelectField
            resource={resource}
            field="newFolderId"
            startLocation={parent}
            label="Choose where to copy"
          />
        </Forms.FieldGroup>

        <Forms.Submit saveText="Copy" cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}
