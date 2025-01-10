import React from "react";
import Forms from "@/components/Forms";
import Modal from "@/components/Modal";

import { Node, useRenameNode } from "@/features/ResourceHub/models";

interface RenameNodeModalProps {
  node: Node;
  isOpen: boolean;
  hideModal: () => void;
}

export function RenameNodeModal({ node, isOpen, hideModal }: RenameNodeModalProps) {
  const rename = useRenameNode(node);

  const form = Forms.useForm({
    fields: {
      name: node.name,
    },
    cancel: hideModal,
    submit: async () => {
      if (form.values.name !== node.name) {
        await rename(form.values.name);
      }

      hideModal();
      form.actions.reset();
    },
  });

  return (
    <Modal title="Rename folder" isOpen={isOpen} hideModal={hideModal}>
      <Forms.Form form={form}>
        <Forms.FieldGroup>
          <Forms.TextInput label="Name" field="name" testId="new-folder-name" required />
        </Forms.FieldGroup>

        <Forms.Submit cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}
