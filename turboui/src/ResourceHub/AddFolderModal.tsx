import * as React from "react";

import type { ResourceHubFormsApi, ResourceHubModalApi } from "./types";
import { useNewFileModalsContext } from "./contexts/NewFileModalsContext";

export interface AddFolderModalProps {
  resourceHubId: string;
  folderId?: string;
  onCreated: () => void;
  forms: ResourceHubFormsApi;
  modal: ResourceHubModalApi;
  onCreateFolder: (args: { resourceHubId: string; folderId?: string; name: string }) => Promise<void>;
}

export function AddFolderModal({
  resourceHubId,
  folderId,
  onCreated,
  forms,
  modal,
  onCreateFolder,
}: AddFolderModalProps) {
  const { showAddFolder, toggleShowAddFolder } = useNewFileModalsContext();
  const { Modal } = modal;

  const form = forms.useForm({
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
    <Modal title="New folder" isOpen={showAddFolder} hideModal={toggleShowAddFolder}>
      <forms.Form form={form}>
        <forms.FieldGroup>
          <forms.TextInput
            label="Name"
            field="name"
            testId="new-folder-name"
            autoFocus
            placeholder="e.g. Monthly Reports"
          />
        </forms.FieldGroup>

        <forms.Submit cancelText="Cancel" />
      </forms.Form>
    </Modal>
  );
}
