import React, { useState } from "react";

import Forms from "@/components/Forms";
import Modal from "@/components/Modal";

interface FormProps {
  file: any;
  cancelUpload: () => void;
  showAddFilePopUp: () => void;
}

export function AddFileModal({ file, cancelUpload, showAddFilePopUp }: FormProps) {
  const form = Forms.useForm({
    fields: {},
    cancel: showAddFilePopUp,
    submit: async () => {},
  });

  return (
    <Modal title="Upload file" isOpen={Boolean(file)} hideModal={cancelUpload}>
      <Forms.Form form={form}>
        <div>File: {file?.name}</div>
        <div>Size: {findFileSize(file?.size)}</div>

        <Forms.Submit cancelText="Change file" />
      </Forms.Form>
    </Modal>
  );
}

export function useAddFile(): FormProps {
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

  const cancelUpload = () => setFile(undefined);

  return { file, showAddFilePopUp, cancelUpload };
}

function findFileSize(size: number) {
  const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  for (let unit of units) {
    if (size < 1024) return `${Math.round(size)}${unit}`;
    size /= 1024;
  }

  return;
}
