import React from "react";

import { ResourceHub, useCreateResourceHubFolder } from "@/models/resourceHubs";
import Modal from "@/components/Modal";
import Forms from "@/components/Forms";

interface FormProps {
  showForm: boolean;
  toggleForm: () => void;
  refresh: () => void;
  resourceHub: ResourceHub;
  folderId?: string;
}

export function AddFolderModal({ resourceHub, showForm, toggleForm, refresh, folderId }: FormProps) {
  const [post] = useCreateResourceHubFolder();

  const form = Forms.useForm({
    fields: {
      name: "",
      description: null,
    },
    validate: (addError) => {
      if (!form.values.name) {
        addError("name", "Name is required");
      }
    },
    cancel: toggleForm,
    submit: async () => {
      await post({
        resourceHubId: resourceHub.id,
        folderId: folderId,
        name: form.values.name,
        description: JSON.stringify(form.values.description),
      });
      refresh();
      toggleForm();
      form.actions.reset();
    },
  });

  return (
    <Modal title="New folder" isOpen={showForm} hideModal={toggleForm}>
      <Forms.Form form={form}>
        <Forms.FieldGroup>
          <Forms.TextInput label="Name" field="name" />
          <Forms.RichTextArea
            label="Description"
            field="description"
            mentionSearchScope={{ type: "none" }}
            placeholder="Description..."
          />
        </Forms.FieldGroup>

        <Forms.Submit cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}