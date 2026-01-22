import React from "react";

import { SecondaryButton } from "../../Button";
import { IconAlertTriangle } from "../../icons";
import { createTestId } from "../../TestableElement";
import { CompanyAdminManagePerson } from "../types";

type PersonHandler = (person: CompanyAdminManagePerson) => void;

export function PersonActions({ person, onOpenRenew }: { person: CompanyAdminManagePerson; onOpenRenew: PersonHandler }) {
  if (person.invitationExpired) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-content-error font-semibold flex items-center gap-2">
          <IconAlertTriangle size={20} />
          Invitation Expired
        </div>

        <SecondaryButton size="xs" onClick={() => onOpenRenew(person)} testId={createTestId("renew-invitation", person.id)}>
          Renew Invitation
        </SecondaryButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <SecondaryButton size="xs" linkTo={person.profileEditPath} testId={createTestId("edit", person.id)}>
        Edit Profile
      </SecondaryButton>
    </div>
  );
}
