import * as React from "react";
import * as Hub from "@/models/resourceHubs";

import Modal from "@/components/Modal";
import Forms, { FormState } from "@/components/Forms";
import { MenuActionItem } from "@/components/Menu";
import { createTestId } from "@/utils/testid";
import { FolderSelectField } from "@/features/ResourceHub/FolderSelectField";

interface Props {
  resource: Hub.Resource;
  showModal: () => void;
}

export function CopyResourceMenuItem({ resource, showModal }: Props) {
  const testId = createTestId("copy-resource", resource.id!);

  return (
    <MenuActionItem onClick={showModal} testId={testId}>
      Copy
    </MenuActionItem>
  );
}

interface FormProps {
  form: FormState<any>;
  resource: Hub.ResourceHubDocument;
  isOpen: boolean;
  hideModal: () => void;
}

export function CopyResourceModal({ form, resource, isOpen, hideModal }: FormProps) {
  return (
    <Modal title={`Create a copy of ${resource.name}`} isOpen={isOpen} hideModal={hideModal}>
      <Forms.Form form={form}>
        <Forms.FieldGroup>
          <Forms.TextInput field="name" label="New document name" />
          <FolderSelectField field="location" label="Select destination" />
        </Forms.FieldGroup>

        <Forms.Submit saveText="Create Copy" cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}
