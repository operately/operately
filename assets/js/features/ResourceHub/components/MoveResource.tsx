import * as React from "react";
import * as Hub from "@/models/resourceHubs";

import Modal from "@/components/Modal";
import Forms from "@/components/Forms";
import { MenuActionItem } from "@/components/Menu";
import { createTestId } from "@/utils/testid";
import { useNodesContext } from "@/features/ResourceHub";
import { FolderSelectField } from "@/features/ResourceHub/FolderSelectField";

interface Props {
  resource: Hub.Resource;
  showModal: () => void;
}

export function MoveResourceMenuItem({ resource, showModal }: Props) {
  const testId = createTestId("move-resource", resource.id!);

  return (
    <MenuActionItem onClick={showModal} testId={testId}>
      Move
    </MenuActionItem>
  );
}

interface FormProps {
  resource: Hub.Resource;
  resourceType: Hub.ResourceTypeName;
  isOpen: boolean;
  hideModal: () => void;
}

export function MoveResourceModal({ resource, resourceType, isOpen, hideModal }: FormProps) {
  const { parent, refetch } = useNodesContext();
  const [edit] = Hub.useEditParentFolderInResourceHub();

  const locationChanged = () => {
    if (!resource.parentFolderId && !form.values.location.id) return false;
    if (resource.parentFolderId === form.values.location.id) return false;
    return true;
  };

  const form = Forms.useForm({
    fields: {
      location: {
        id: parent?.id,
        type: "pathToFolder" in parent ? "folder" : "resourceHub",
      },
    },
    validate: (addError) => {
      if (resource.id === form.values.location.id) {
        addError("location", "Folder cannot be moved inside itself.");
      }
    },
    cancel: hideModal,
    submit: async () => {
      if (locationChanged()) {
        await edit({
          newFolderId: form.values.location.type === "folder" ? form.values.location.id : null,
          resourceId: resource.id,
          resourceType: resourceType,
        });

        refetch();
      }

      hideModal();
      form.actions.reset();
    },
  });

  // prevent moving a folder into itself
  const notAllowedSelections = [{ id: resource.id!, type: resourceType }];

  return (
    <Modal title={`Move “${resource.name}”`} isOpen={isOpen} hideModal={hideModal}>
      <Forms.Form form={form}>
        <Forms.FieldGroup>
          <FolderSelectField field="location" notAllowedSelections={notAllowedSelections} />
        </Forms.FieldGroup>

        <Forms.Submit saveText="Move" cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}
