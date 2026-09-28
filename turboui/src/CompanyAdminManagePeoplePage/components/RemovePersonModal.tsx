import React from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  if (!person) return null;

  const firstName = firstNameFromFullName(person.fullName);
  const isInvitation = person.hasOpenInvitation;

  const title = isInvitation
    ? t("Revoke invitation for {{name}}?", { name: firstName })
    : t("Remove {{name}} from the company?", { name: firstName });
  const message = isInvitation
    ? t("This will revoke {{name}}'s invitation. You can create a new invitation later if needed.", { name: firstName })
    : t(
        "This will deactivate {{name}}'s account, restricting access to company resources. You can restore access later if needed.",
        { name: firstName },
      );
  const buttonText = isInvitation ? t("Revoke") : t("Deactivate");

  return (
    <LegacyModal title={title} isOpen={isOpen} onClose={onClose} size="base">
      <div>{message}</div>
      <div className="mt-8 flex gap-2">
        <PrimaryButton onClick={onConfirm} loading={loading} testId="confirm-remove-member" size="sm">
          {buttonText}
        </PrimaryButton>
        <SecondaryButton onClick={onClose} testId="cancel-remove-member" size="sm">
          {t("Cancel")}
        </SecondaryButton>
      </div>
    </LegacyModal>
  );
}

function firstNameFromFullName(fullName: string) {
  return fullName.split(" ")[0] || fullName;
}
