import React from "react";

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
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Other People with Access" size="medium" testId={testId}>
      <OtherPeopleWithAccess people={people ?? []} loading={loading || people === undefined} showTitle={false} />
    </Modal>
  );
}
