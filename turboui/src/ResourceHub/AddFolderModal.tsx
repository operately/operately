import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const { showAddFolder, toggleShowAddFolder } = useNewFileModalsContext();

  const form = Forms.useForm({
    fields: {
      name: "",
    },
    validate: (addError: (field: string, message: string) => void) => {
      if (!form.values.name) {
        addError("name", t("Name is required"));
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
    <Modal title={t("New folder")} isOpen={showAddFolder} onClose={toggleShowAddFolder}>
      <Forms.Form form={form}>
        <Forms.FieldGroup>
          <Forms.TextInput
            label={t("Name")}
            field="name"
            testId="new-folder-name"
            autoFocus
            placeholder={t("e.g. Monthly Reports")}
          />
        </Forms.FieldGroup>

        <Forms.Submit cancelText={t("Cancel")} />
      </Forms.Form>
    </Modal>
  );
}
