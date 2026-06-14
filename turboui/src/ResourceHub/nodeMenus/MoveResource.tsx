import * as React from "react";

import * as Forms from "../../Forms";
import { MenuActionItem } from "../../Menu";
import Modal from "../../Modal";
import { createTestId } from "../../TestableElement";
import { useResourceHubNodesListContext } from "../contexts/NodesListContext";
import { FolderSelectField } from "../FolderSelectField";
import { getResourceName, getResourceParentFolderId } from "../selectors";
import type { ResourceHubResource, ResourceHubResourceTypeName } from "../types";

interface MoveResourceMenuItemProps {
  resource: { id: string; name?: string | null };
  showModal: () => void;
}

export function MoveResourceMenuItem({ resource, showModal }: MoveResourceMenuItemProps) {
  const testId = createTestId("move", resource.id);

  return (
    <MenuActionItem onClick={showModal} testId={testId}>
      Move
    </MenuActionItem>
  );
}

interface MoveResourceModalProps {
  resource: ResourceHubResource;
  resourceType: ResourceHubResourceTypeName;
  isOpen: boolean;
  hideModal: () => void;
}

export function MoveResourceModal({ resource, resourceType, isOpen, hideModal }: MoveResourceModalProps) {
  const { parent, onRefetch, actions } = useResourceHubNodesListContext();
  const parentFolderId = getResourceParentFolderId(resource);

  const locationChanged = (location: { id?: string | null; type: string }) => {
    if (!parentFolderId && !location.id) return false;
    if (parentFolderId === location.id) return false;
    return true;
  };

  const form = Forms.useForm({
    fields: {
      location: {
        id: parent.id,
        type: parent.type === "folder" ? "folder" : "resourceHub",
      },
    },
    validate: (addError: (field: string, message: string) => void) => {
      const location = form.values.location as { id?: string | null };
      if (resource.id === location.id) {
        addError("location", "Folder cannot be moved inside itself.");
      }
    },
    cancel: hideModal,
    submit: async () => {
      const location = form.values.location as { id?: string | null; type: string };
      const moveResource = actions.moveResource;

      if (locationChanged(location) && moveResource) {
        await moveResource({
          resourceId: resource.id,
          resourceType,
          newFolderId: location.type === "folder" ? location.id || null : null,
        });
        onRefetch?.();
      }

      hideModal();
      form.actions.reset();
    },
  });

  const notAllowedSelections = React.useMemo(
    () => [{ id: resource.id, type: resourceType }],
    [resource.id, resourceType],
  );

  return (
    <Modal title={`Move ${getResourceName(resource)}`} isOpen={isOpen} onClose={hideModal}>
      <Forms.Form form={form} testId="move-resource-modal">
        <Forms.FieldGroup>
          <FolderSelectField field="location" notAllowedSelections={notAllowedSelections} label="Select destination" />
        </Forms.FieldGroup>

        <Forms.Submit saveText="Move Here" cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}
