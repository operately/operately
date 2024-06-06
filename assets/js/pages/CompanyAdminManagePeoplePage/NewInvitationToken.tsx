import React, { useState } from "react";

import { GhostButton } from "@/components/Button";
import Modal from "@/components/Modal";
import { InvitationUrl, createInvitationUrl } from "@/features/CompanyAdmin";
import { Person, useNewInvitationTokenMutation } from "@/gql";
import { createTestId } from "@/utils/testid";



export default function NewInvitationToken({ person }: { person: Person }) {
  const newTokenTestId = createTestId("new-token", person.fullName);

  const [showToken, setShowToken] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  
  const [create, { loading }] = useNewInvitationTokenMutation({
    onCompleted: (res) => {
      const result = createInvitationUrl(res["newInvitationToken"]["token"]);
      
      setUrl(result);
      setShowToken(true);
    },
  });

  const handleHideModal = () => {
    setUrl("");
    setError("");
    setShowToken(false);
  }

  const handleTokenCreation = async () => {
    try {
      await create({
        variables: {
          personId: person.id,
        }
      });
    }
    catch (e) {
      if (e.message) {
        setError(e.message);
      }
      else {
        setError("There was an unexpected error. Please try again.");
      }
      setShowToken(true);
    }
  }

  return (
    <>
      <GhostButton
        onClick={handleTokenCreation}
        loading={loading}
        size="xxs"
        type="secondary"
        testId={newTokenTestId}
      >
        New Invitation
      </GhostButton>
    
      <Modal
        title="New Invitation URL"
        isOpen={showToken}
        hideModal={handleHideModal}
        minHeight="120px"
      >
        {error ?
          <div>{error}</div>
        :
          <InvitationUrl url={url} />
        }
      </Modal>
    </>
  );
}