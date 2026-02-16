import React from "react";

import { PrimaryButton } from "../../Button";
import type { CompanyAdminManagePerson } from "../types";
import { InvitationUrl } from "./InvitationUrl";
import { LegacyModal } from "./LegacyModal";

export function ReissueInvitationModal({
  isOpen,
  person,
  onClose,
  onGenerate,
  inviteUrl,
  isGenerated,
  loading,
}: {
  isOpen: boolean;
  person: CompanyAdminManagePerson | null;
  onClose: () => void;
  onGenerate: () => void;
  inviteUrl: string;
  isGenerated: boolean;
  loading: boolean;
}) {
  if (!person) return null;

  return (
    <LegacyModal title="Regenerate the invitation URL" isOpen={isOpen} onClose={onClose} size="lg">
      <div>
        By clicking the button below:
        <ul className="list-disc list-inside mt-2 block">
          <li>A new invitation URL will be generated for {person.fullName}.</li>
          <li>The previous URL will no longer be valid.</li>
        </ul>
      </div>

      {!isGenerated && <NewInvitationButton onClick={onGenerate} loading={loading} />}
      {isGenerated && <InvitationUrl url={inviteUrl} personName={person.fullName} />}
    </LegacyModal>
  );
}

function NewInvitationButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <div className="flex items-center mt-4">
      <PrimaryButton onClick={onClick} loading={loading} testId="confirm-reissue">
        I understand, create new invitation
      </PrimaryButton>
    </div>
  );
}
