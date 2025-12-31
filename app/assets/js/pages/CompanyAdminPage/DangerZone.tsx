import React, { useState } from "react";
import Modal from "@/components/Modal";
import * as Companies from "@/models/companies";
import { useLoadedData } from "./loader";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { includesId, Paths } from "@/routes/paths";
import { showErrorToast, IconTrash, DangerButton, SecondaryButton, WarningCallout } from "turboui";

import { OptionsMenuItem } from "./OptionsMenu";
import * as Paper from "@/components/PaperContainer";

export function DangerZone() {
  const { company, ownerIds } = useLoadedData();
  const me = useMe();
  const amIOwner = includesId(ownerIds, me!.id);

  if (!amIOwner) return null;

  return (
    <Paper.Section title="Danger Zone:">
      <div className="bg-surface-base">
        <DeleteOrganizationItem companyName={company.name!} />
      </div>
    </Paper.Section>
  );
}

function DeleteOrganizationItem({ companyName }: { companyName: string }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <OptionsMenuItem
        icon={IconTrash}
        title="Delete this organization"
        onClick={() => setShowModal(true)}
        danger
        description="Permanently delete the organization and all its resources. This action cannot be undone."
      />

      {showModal && (
        <DeleteOrganizationModal companyName={companyName} isOpen={showModal} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

function DeleteOrganizationModal({
  companyName,
  isOpen,
  onClose,
}: {
  companyName: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [confirmName, setConfirmName] = useState("");
  const [deleteCompanyMutation, { loading }] = Companies.useDeleteCompany();

  const handleConfirm = async () => {
    if (confirmName !== companyName) return;

    try {
      await deleteCompanyMutation({});
      window.location.href = Paths.lobbyPath();
    } catch (e) {
      console.error("Failed to delete company", e);
      showErrorToast("Error", "Failed to delete company");
    }
  };

  return (
    <Modal isOpen={isOpen} hideModal={onClose} title="Delete Organization" size="base">
      <div className="space-y-4">
        <WarningCallout
          message="This action cannot be undone."
          description={
            <>
              This will permanently delete <strong>{companyName}</strong> and its spaces, goals, projects, and other
              resources.
            </>
          }
        />

        <div>
          <label className="block text-sm font-medium text-content-accent mb-1">
            To confirm, type "{companyName}" in the box below
          </label>
          <input
            type="text"
            data-test-id="confirm-delete-input"
            className="w-full px-3 py-2 border border-stroke-base rounded focus:outline-none bg-surface-base text-content-accent"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="pt-4 flex justify-start gap-2">
          <DangerButton
            onClick={handleConfirm}
            disabled={confirmName !== companyName || loading}
            loading={loading}
            testId="confirm-delete-button"
          >
            {loading ? "Deleting..." : "Delete Organization"}
          </DangerButton>
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        </div>
      </div>
    </Modal>
  );
}
