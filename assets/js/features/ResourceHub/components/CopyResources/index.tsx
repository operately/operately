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

  const form = Forms.useForm({
    fields: {
      name: resource.name,
      spaceId: "product",
      newFolderId: "pathToFolder" in parent ? parent.id : null,
    },
    cancel: hideModal,
    submit: async () => {
      await edit({
        newFolderId: form.values.newFolderId,
        resourceId: resource.id,
        resourceType: resourceType,
      });

      refetch();
      hideModal();
      form.actions.reset();
    },
  });

  return (
    <Modal title={`Create a copy of ${resource.name}`} isOpen={true} hideModal={hideModal}>
      <Forms.Form form={form}>
        <Forms.FieldGroup>
          <Forms.TextInput label="New file Name" field="name" />

          <FolderSelectField
            resource={resource}
            field="newFolderId"
            startLocation={parent}
            label="Destination Folder"
          />
        </Forms.FieldGroup>

        <Forms.Submit saveText="Copy File" cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}
