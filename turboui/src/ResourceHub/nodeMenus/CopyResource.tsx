import * as React from "react";

import { MenuActionItem } from "../../Menu";
import { createTestId } from "../../TestableElement";
import { useResourceHubNodesListContext } from "../contexts/NodesListContext";
import { FolderSelectField } from "../FolderSelectField";
import { getResourceName } from "../selectors";
import type { ResourceHubFormState, ResourceHubResource } from "../types";

interface CopyResourceMenuItemProps {
  resource: { id: string; name?: string | null };
  showModal: () => void;
}

export function CopyResourceMenuItem({ resource, showModal }: CopyResourceMenuItemProps) {
  const testId = createTestId("copy-resource", resource.id);

  return (
    <MenuActionItem onClick={showModal} testId={testId}>
      Copy
    </MenuActionItem>
  );
}

interface CopyResourceModalProps {
  form: ResourceHubFormState;
  resource: ResourceHubResource;
  isOpen: boolean;
  hideModal: () => void;
}

export function CopyResourceModal({ form, resource, isOpen, hideModal }: CopyResourceModalProps) {
  const { forms, modal } = useResourceHubNodesListContext();
  const { Modal } = modal;

  return (
    <Modal title={`Create a copy of ${getResourceName(resource)}`} isOpen={isOpen} hideModal={hideModal}>
      <forms.Form form={form} testId="copy-resource-modal">
        <forms.FieldGroup>
          <forms.TextInput field="name" label="New document name" required />
          <FolderSelectField field="location" label="Select destination" />
        </forms.FieldGroup>

        <forms.Submit saveText="Create Copy" cancelText="Cancel" />
      </forms.Form>
    </Modal>
  );
}
