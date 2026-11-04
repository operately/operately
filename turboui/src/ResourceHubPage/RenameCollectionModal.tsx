import * as React from "react";
import { useTranslation } from "react-i18next";

import * as Forms from "../Forms";
import Modal from "../Modal";
import type { ResourceHub } from "../ResourceHub";

interface Props {
  resourceHub: ResourceHub;
  onRename: (id: string, name: string) => Promise<void>;
  onClose: () => void;
}

// Mounted when opened so every draft starts with the current saved name.
export function RenameCollectionModal({ resourceHub, onRename, onClose }: Props) {
  const { t } = useTranslation();
  const submitting = React.useRef(false);
  const [saveFailed, setSaveFailed] = React.useState(false);
  const close = () => {
    if (!submitting.current) onClose();
  };
  const form = Forms.useForm({
    fields: { name: resourceHub.name },
    validate: (addError) => {
      if (!form.values.name.trim()) addError("name", t("Name is required"));
    },
    cancel: close,
    submit: async () => {
      if (submitting.current) return;
      const name = form.values.name.trim();
      if (name === resourceHub.name.trim()) {
        onClose();
        return;
      }

      submitting.current = true;
      setSaveFailed(false);
      try {
        await onRename(resourceHub.id, name);
        onClose();
      } catch {
        setSaveFailed(true);
      } finally {
        submitting.current = false;
      }
    },
  });

  return (
    <Modal title={t("Rename Docs & Files")} isOpen onClose={close}>
      <Forms.Form form={form}>
        <Forms.FieldGroup>
          <Forms.TextInput label={t("Name")} field="name" testId="new-collection-name" autoFocus />
        </Forms.FieldGroup>
        <Forms.FormError when={saveFailed} message={t("Could not rename Docs & Files. Try again.")} className="mt-4" />
        <Forms.Submit cancelText={t("Cancel")} testId="save-collection-name" disabled={form.state !== "idle"} />
      </Forms.Form>
    </Modal>
  );
}
