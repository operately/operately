import React from "react";

import { ResourceHub, ResourceHubFolder, useCreateResourceHubFolder } from "@/models/resourceHubs";
import Modal from "@/components/Modal";
import Forms from "@/components/Forms";
import { useNewFileModalsContext } from "./contexts/NewFileModalsContext";

interface FormProps {
  refresh: () => void;
  resourceHub: ResourceHub;
  folder?: ResourceHubFolder;
}

export function AddFolderModal({ resourceHub, refresh, folder }: FormProps) {
  const [post] = useCreateResourceHubFolder();
  const { showAddFolder, toggleShowAddFolder } = useNewFileModalsContext();

  const form = Forms.useForm({
    fields: {
      name: "",
    },
    validate: (addError) => {
      if (!form.values.name) {
        addError("name", "Name is required");
      }
    },
    cancel: toggleShowAddFolder,
    submit: async () => {
      await post({
        resourceHubId: resourceHub.id,
        folderId: folder?.id,
        name: form.values.name,
      });
      refresh();
      toggleShowAddFolder();
      form.actions.reset();
    },
  });

  return (
    <Modal title="New folder" isOpen={showAddFolder} hideModal={toggleShowAddFolder}>
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
