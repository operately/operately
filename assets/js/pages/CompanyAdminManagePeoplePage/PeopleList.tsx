import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useLoadedData } from "./loader";
import { useRemoveMemberMutation } from "@/models/companies";
import { createTestId } from "@/utils/testid";
import { Person } from "@/gql";
import { FilledButton, GhostButton } from "@/components/Button";
import Modal from "@/components/Modal";
import Avatar from "@/components/Avatar";



export function PeopleList() {
  const { company } = useLoadedData();

  return (
    <div className="mt-8 grid grid-cols-3 gap-4">
      {company.people!.map((person) => (
        <PersonRow key={person!.id} person={person!} />
      ))}
    </div>
  );
}


function PersonRow({ person }: { person: Person }) {
  const [showRemoveMember, setShowRemoveMember] = useState(false);
  const removeTestId = createTestId("remove", person.fullName);
  
  return (
    <>
      <div className="flex flex-col gap-4 items-center border border-stroke-base rounded-lg p-4 py-6">
        <Avatar person={person} size="xlarge" />

        <div className="flex flex-col text-center items-center">
          <div className="text-content-primary font-bold">{person.fullName}</div>
          <div className="text-content-secondary text-sm">{person.title}</div>
          <div className="text-content-secondary text-sm break-all">{person.email}</div>
        </div>

        <div>
          <GhostButton
            onClick={() => setShowRemoveMember(true)}
            size="xxs"
            type="secondary"
            testId={removeTestId}
          >
            Remove
          </GhostButton>
        </div>
      </div>

      <RemoveMemberModal
        isOpen={showRemoveMember}
        hideModal={() => setShowRemoveMember(false)}
        person={person}
      />
    </>
  );
}


function RemoveMemberModal({isOpen, hideModal, person}: {isOpen: boolean, hideModal: ()=>void, person: Person}) {
  const navigate = useNavigate();
  const [remove, { loading }] = useRemoveMemberMutation({
    onCompleted: () => {
      navigate(0);
    }
  });

  const handleRemoveMember = async () => {
    await remove({
      variables: { personId: person.id }
    });
  }

  return (
    <Modal
      title="Remove Company Member"
      isOpen={isOpen}
      hideModal={hideModal}
      minHeight="150px"
    >
      <div>Are you sure you want to remove {person.fullName} from the company?</div>
      <div className="mt-8 flex justify-center">
        <FilledButton
          onClick={handleRemoveMember}
          type="primary"
          loading={loading}
          testId="remove-member"
        >
          Remove Member
        </FilledButton>
      </div>
    </Modal>
  );
}
