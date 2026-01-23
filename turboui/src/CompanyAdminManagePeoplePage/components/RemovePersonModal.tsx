import React from "react";

import { PrimaryButton, SecondaryButton } from "../../Button";
import type { CompanyAdminManagePerson } from "../types";
import { LegacyModal } from "./LegacyModal";

export function RemovePersonModal({
  isOpen,
  person,
  onClose,
  onConfirm,
  loading,
}: {
  isOpen: boolean;
  person: CompanyAdminManagePerson | null;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  if (!person) return null;

  const firstName = firstNameFromFullName(person.fullName);
  const isInvitation = person.hasOpenInvitation;

  const title = isInvitation ? `Revoke invitation for ${firstName}?` : `Remove ${firstName} from the company?`;
  const message = isInvitation
    ? `This will revoke ${firstName}'s invitation. You can create a new invitation later if needed.`
    : `This will deactivate ${firstName}'s account, restricting access to company resources. You can restore access later if needed.`;
  const buttonText = isInvitation ? "Revoke" : "Deactivate";

  return (
    <LegacyModal title={title} isOpen={isOpen} onClose={onClose} size="base">
      <div>{message}</div>
      <div className="mt-8 flex gap-2">
        <PrimaryButton onClick={onConfirm} loading={loading} testId="confirm-remove-member" size="sm">
          {buttonText}
        </PrimaryButton>
        <SecondaryButton onClick={onClose} testId="cancel-remove-member" size="sm">
          Cancel
        </SecondaryButton>
      </div>
    </LegacyModal>
  );
}

function firstNameFromFullName(fullName: string) {
  return fullName.split(" ")[0] || fullName;
}
