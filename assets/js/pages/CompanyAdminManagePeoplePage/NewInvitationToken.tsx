import React, { useState } from "react";
import * as People from "@/models/people";
import * as Companies from "@/models/companies";

import { GhostButton } from "@/components/Button";
import Modal from "@/components/Modal";
import { createInvitationUrl } from "@/features/CompanyAdmin";
import { createTestId } from "@/utils/testid";
import { CopyToClipboard } from "@/components/CopyToClipboard";

export default function NewInvitationToken({ person }: { person: People.Person }) {
  const newTokenTestId = createTestId("new-token", person.fullName!);

  const [showToken, setShowToken] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const [create, { loading }] = Companies.useNewInvitationToken();

  const handleHideModal = () => {
    setUrl("");
    setError("");
    setShowToken(false);
  };

  const handleTokenCreation = async () => {
    try {
      const res = await create({ personId: person.id! });
      const result = createInvitationUrl(res.invitation!.token!);

      setUrl(result);
      setShowToken(true);
    } catch (e) {
      console.log(e.response?.data);
      if (e.response?.data?.message) {
        setError(e.response.data.message);
      } else {
        setError("There was an unexpected error. Please try again.");
      }
      setShowToken(true);
    }
  };

  return (
    <>
      <GhostButton onClick={handleTokenCreation} loading={loading} size="xxs" type="secondary" testId={newTokenTestId}>
        New Invitation
      </GhostButton>

      <Modal title="New Invitation URL" isOpen={showToken} hideModal={handleHideModal} minHeight="120px">
        {error ? (
          <div>{error}</div>
        ) : (
          <div className="text-content-primary border border-surface-outline rounded-lg px-3 py-1 font-medium flex items-center justify-between">
            <span className="break-all">{url}</span>
            <CopyToClipboard text={url} size={25} padding={1} containerClass="" />
          </div>
        )}
      </Modal>
    </>
  );
}
