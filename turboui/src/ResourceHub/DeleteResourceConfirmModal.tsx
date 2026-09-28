import { Trans, useTranslation } from "react-i18next";
import React from "react";

import { DangerButton, SecondaryButton } from "../Button";
import { Modal } from "../Modal";

export function DeleteResourceConfirmModal({
  isOpen,
  onClose,
  resourceType,
  resourceName,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  resourceType: string;
  resourceName: string;
  onConfirm: () => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <p>
        <DeleteResourceMessage resourceType={resourceType} resourceName={resourceName} />
      </p>
      <div className="flex items-center gap-2 mt-6">
        <DangerButton size="sm" onClick={handleDelete} loading={isDeleting} disabled={isDeleting} testId="submit">
          {t("Delete")}
        </DangerButton>
        <SecondaryButton size="sm" onClick={onClose}>
          {t("Cancel")}
        </SecondaryButton>
      </div>
    </Modal>
  );
}

function DeleteResourceMessage({ resourceType, resourceName }: { resourceType: string; resourceName: string }) {
  const values = { resourceName, resourceType };
  const components = { name: <b /> };
  switch (resourceType) {
    case "document":
      return (
        <Trans
          i18nKey={'Are you sure you want to delete the document "<name>{{resourceName}}</name>"?'}
          values={values}
          components={components}
        />
      );
    case "file":
      return (
        <Trans
          i18nKey={'Are you sure you want to delete the file "<name>{{resourceName}}</name>"?'}
          values={values}
          components={components}
        />
      );
    case "folder":
      return (
        <Trans
          i18nKey={'Are you sure you want to delete the folder "<name>{{resourceName}}</name>"?'}
          values={values}
          components={components}
        />
      );
    case "link":
      return (
        <Trans
          i18nKey={'Are you sure you want to delete the link "<name>{{resourceName}}</name>"?'}
          values={values}
          components={components}
        />
      );
    case "draft":
      return (
        <Trans
          i18nKey={'Are you sure you want to delete the draft "<name>{{resourceName}}</name>"?'}
          values={values}
          components={components}
        />
      );
    default:
      return (
        <Trans
          i18nKey={'Are you sure you want to delete the {{resourceType}} "<name>{{resourceName}}</name>"?'}
          values={values}
          components={components}
        />
      );
  }
}
