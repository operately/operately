import { useTranslation } from "react-i18next";
import * as React from "react";

import * as Forms from "../../Forms";
import type { FormState } from "../../Forms";
import { MenuActionItem } from "../../Menu";
import Modal from "../../Modal";
import { createTestId } from "../../TestableElement";
import { ResourceHubFolderSelectField } from "../FolderSelectField";
import { getResourceName } from "../selectors";
import type { ResourceHubResource } from "../types";

interface CopyResourceMenuItemProps {
  resource: { id: string; name?: string | null };
  showModal: () => void;
}

export function CopyResourceMenuItem({ resource, showModal }: CopyResourceMenuItemProps) {
  const { t } = useTranslation();
  const testId = createTestId("copy-resource", resource.id);

  return (
    <MenuActionItem onClick={showModal} testId={testId}>
      {t("Copy")}
    </MenuActionItem>
  );
}

interface CopyResourceModalProps {
  form: FormState<Record<string, unknown>>;
  resource: ResourceHubResource;
  isOpen: boolean;
  hideModal: () => void;
}

export function CopyResourceModal({ form, resource, isOpen, hideModal }: CopyResourceModalProps) {
  const { t } = useTranslation();
  return (
    <Modal
      title={t("Create a copy of {{name}}", { name: getResourceName(resource) })}
      isOpen={isOpen}
      onClose={hideModal}
    >
      <Forms.Form form={form} testId="copy-resource-modal">
        <Forms.FieldGroup>
          <Forms.TextInput field="name" label={t("New document name")} required />
          <ResourceHubFolderSelectField field="location" label={t("Select destination")} />
        </Forms.FieldGroup>

        <Forms.Submit saveText={t("Create Copy")} cancelText={t("Cancel")} />
      </Forms.Form>
    </Modal>
  );
}
