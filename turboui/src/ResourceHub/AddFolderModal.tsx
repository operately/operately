import * as React from "react";

import * as Forms from "../Forms";
import Modal from "../Modal";

export interface AddFolderModalProps {
  parentFolderId?: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  onCreateFolder: (args: { parentFolderId?: string; name: string }) => Promise<boolean | void>;
}

export function AddFolderModal({ parentFolderId, isOpen, onClose, onCreated, onCreateFolder }: AddFolderModalProps) {
  const form = Forms.useForm({
    fields: {
      name: "",
    },
    validate: (addError: (field: string, message: string) => void) => {
      if (!form.values.name) {
        addError("name", "Name is required");
      }
    },
    cancel: onClose,
    submit: async () => {
      const created = await onCreateFolder({
        parentFolderId,
        name: form.values.name as string,
      });

      if (created === false) return;

      onCreated();
      onClose();
      form.actions.reset();
    },
  });

  return (
    <Modal title="New folder" isOpen={isOpen} onClose={onClose}>
      <Forms.Form form={form}>
        <Forms.FieldGroup>
          <Forms.TextInput
            label="Name"
            field="name"
            testId="new-folder-name"
            autoFocus
            placeholder="e.g. Monthly Reports"
          />
        </Forms.FieldGroup>

        <Forms.Submit cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}
