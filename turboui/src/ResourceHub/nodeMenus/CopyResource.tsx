import * as React from "react";

import * as Forms from "../../Forms";
import type { FormState } from "../../Forms";
import { MenuActionItem } from "../../Menu";
import Modal from "../../Modal";
import { createTestId } from "../../TestableElement";
import { FolderSelectField } from "../FolderSelectField";
import { getResourceName } from "../selectors";
import type { ResourceHubResource } from "../types";

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
  form: FormState<Record<string, unknown>>;
  resource: ResourceHubResource;
  isOpen: boolean;
  hideModal: () => void;
}

export function CopyResourceModal({ form, resource, isOpen, hideModal }: CopyResourceModalProps) {
  return (
    <Modal title={`Create a copy of ${getResourceName(resource)}`} isOpen={isOpen} onClose={hideModal}>
      <Forms.Form form={form} testId="copy-resource-modal">
        <Forms.FieldGroup>
          <Forms.TextInput field="name" label="New document name" required />
          <FolderSelectField field="location" label="Select destination" />
        </Forms.FieldGroup>

        <Forms.Submit saveText="Create Copy" cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}
