import React, { useState } from "react";

import { uploadFile } from "@/models/blobs";
import { useCreateResourceHubFile } from "@/models/resourceHubs";

import Forms from "@/components/Forms";
import Modal from "@/components/Modal";

interface UseFormProps {
  file: any;
  hideAddFilePopUp: () => void;
  showAddFilePopUp: () => void;
}

interface FormProps extends UseFormProps {
  resourceHubId: string;
  folderId?: string;
  refresh: () => void;
}

export function AddFileModal({
  file,
  resourceHubId,
  folderId,
  hideAddFilePopUp,
  showAddFilePopUp,
  refresh,
}: FormProps) {
  const [post] = useCreateResourceHubFile();

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
    cancel: showAddFilePopUp,
    submit: async () => {
      const blob = await uploadFile(file, () => {});
      await post({
        name: form.values.name,
        description: JSON.stringify(form.values.description),
        blobId: blob.id,
        resourceHubId: resourceHubId,
        folderId: folderId,
      });
      refresh();
      hideAddFilePopUp();
      form.actions.reset();
    },
  });

  return (
    <Modal title="Upload file" isOpen={Boolean(file)} hideModal={hideAddFilePopUp}>
      <Forms.Form form={form}>
        <Forms.FieldGroup>
          <Forms.TextInput label="Name" field="name" />
          <Forms.RichTextArea
            label="Description"
            field="description"
            mentionSearchScope={{ type: "none" }}
            placeholder="Description..."
          />
          <div>
            <div>File: {file?.name}</div>
            <div>Size: {findFileSize(file?.size)}</div>
          </div>
        </Forms.FieldGroup>

        <Forms.Submit cancelText="Change file" />
      </Forms.Form>
    </Modal>
  );
}

export function useAddFile(): UseFormProps {
  const [file, setFile] = useState();

  const showAddFilePopUp = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";

    fileInput.onchange = (e: any) => {
      const file = e.target?.files[0];
      setFile(file);
    };

    fileInput.click();
  };

  const hideAddFilePopUp = () => setFile(undefined);

  return { file, showAddFilePopUp, hideAddFilePopUp };
}

function findFileSize(size: number) {
  const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  for (let unit of units) {
    if (size < 1024) return `${Math.round(size)}${unit}`;
    size /= 1024;
  }

  return;
}
