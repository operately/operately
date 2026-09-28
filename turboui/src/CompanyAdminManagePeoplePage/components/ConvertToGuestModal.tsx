import React from "react";
import { useTranslation } from "react-i18next";

import { PrimaryButton, SecondaryButton } from "../../Button";
import { translationText } from "../../i18n";
import type { CompanyAdminManagePerson } from "../types";
import { LegacyModal } from "./LegacyModal";

interface Props {
  isOpen: boolean;
  person: CompanyAdminManagePerson | null;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

export function ConvertToGuestModal({ isOpen, person, onClose, onConfirm, loading }: Props) {
  const { t } = useTranslation();
  if (!person) return null;

  const firstName = firstNameFromFullName(person.fullName);

  return (
    <LegacyModal title={translationText(t("Convert {{name}} to outside collaborator?", { name: firstName }))} isOpen={isOpen} onClose={onClose} size="base">
      <div>
        {t(
          "This will remove {{name}}'s team-member permissions. They will have access only to work where they are explicitly invited.",
          { name: firstName },
        )}
      </div>

      <div className="mt-8 flex gap-2">
        <PrimaryButton onClick={onConfirm} loading={loading} testId="confirm-convert-member-to-guest" size="sm">
          {t("Convert")}
        </PrimaryButton>
        <SecondaryButton onClick={onClose} testId="cancel-convert-member-to-guest" size="sm">
          {t("Cancel")}
        </SecondaryButton>
      </div>
    </LegacyModal>
  );
}

function firstNameFromFullName(fullName: string) {
  return fullName.split(" ")[0] || fullName;
}
