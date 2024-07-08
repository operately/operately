import React, { useState } from "react";
import * as People from "@/models/people";
import * as Companies from "@/models/companies";
import { useNavigate } from "react-router-dom";

import { createTestId } from "@/utils/testid";
import { FilledButton, GhostButton } from "@/components/Button";
import Modal from "@/components/Modal";

export default function RemoveMember({ person }: { person: People.Person }) {
  const removeTestId = createTestId("remove", person.fullName!);
  const [showRemoveMember, setShowRemoveMember] = useState(false);

  const navigate = useNavigate();
  const [remove, { loading }] = Companies.useRemoveCompanyMember();

  const handleRemoveMember = async () => {
    await remove({ personId: person.id });

    navigate(0);
  };

  return (
    <>
      <GhostButton onClick={() => setShowRemoveMember(true)} size="xxs" type="secondary" testId={removeTestId}>
        Remove
      </GhostButton>

      <Modal
        title="Remove Company Member"
        isOpen={showRemoveMember}
        hideModal={() => setShowRemoveMember(false)}
        minHeight="150px"
      >
        <div>Are you sure you want to remove {person.fullName} from the company?</div>
        <div className="mt-8 flex justify-center">
          <FilledButton onClick={handleRemoveMember} type="primary" loading={loading} testId="remove-member">
            Remove Member
          </FilledButton>
        </div>
      </Modal>
    </>
  );
}
