import React from "react";
import { useTranslation } from "react-i18next";

import { Modal } from "../Modal";
import { OtherPeopleWithAccess } from "./OtherPeopleWithAccess";

export interface OtherPeopleWithAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: OtherPeopleWithAccess.Person[] | undefined;
  loading?: boolean;
  testId?: string;
}

export function OtherPeopleWithAccessModal({
  isOpen,
  onClose,
  people,
  loading = false,
  testId = "other-people-with-access-modal",
}: OtherPeopleWithAccessModalProps) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("Other People with Access")} size="medium" testId={testId}>
      <OtherPeopleWithAccess people={people ?? []} loading={loading || people === undefined} showTitle={false} />
    </Modal>
  );
}
