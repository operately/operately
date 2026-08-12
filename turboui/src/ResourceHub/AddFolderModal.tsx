import * as React from "react";

import * as Forms from "../Forms";
import Modal from "../Modal";
import { useNewFileModalsContext } from "./contexts/NewFileModalsContext";

export interface AddFolderModalProps {
  resourceHubId: string;
  folderId?: string;
  onCreated: () => void;
  onCreateFolder: (args: { resourceHubId: string; folderId?: string; name: string }) => Promise<void>;
}

export function AddFolderModal({ resourceHubId, folderId, onCreated, onCreateFolder }: AddFolderModalProps) {
  const { showAddFolder, toggleShowAddFolder } = useNewFileModalsContext();

  const form = Forms.useForm({
    fields: {
      name: "",
    },
    validate: (addError: (field: string, message: string) => void) => {
      if (!form.values.name) {
        addError("name", "Name is required");
      }
    },
    cancel: toggleShowAddFolder,
    submit: async () => {
      await onCreateFolder({
        resourceHubId,
        folderId,
        name: form.values.name as string,
      });
      onCreated();
      toggleShowAddFolder();
      form.actions.reset();
    },
  });

  return (
    <Modal title="New folder" isOpen={showAddFolder} onClose={toggleShowAddFolder}>
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
