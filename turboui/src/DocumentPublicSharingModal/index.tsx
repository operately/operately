import React from "react";
import { PrimaryButton, SecondaryButton } from "../Button";
import { ErrorCallout } from "../Callouts";
import { CopyToClipboard } from "../CopyToClipboard";
import { Modal } from "../Modal";

export namespace DocumentPublicSharingModal {
  export interface Props {
    isOpen: boolean;
    onClose: () => void;
    publicUrl: string | null;
    onChange: (enabled: boolean) => Promise<void>;
  }
}

export function DocumentPublicSharingModal({ isOpen, onClose, publicUrl, onChange }: DocumentPublicSharingModal.Props) {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(false);

  async function update(enabled: boolean) {
    setSaving(true);
    setError(false);
    try {
      await onChange(enabled);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={saving ? () => {} : onClose}
      title="Share publicly"
      size="medium"
      testId="document-public-sharing-modal"
    >
      <div className="flex flex-col gap-4">
        <p>Anyone with the link can read the latest version of this document and its attachments without signing in.</p>
        {publicUrl ? (
          <>
            <div className="flex items-center gap-2 rounded border border-surface-outline p-3">
              <span className="min-w-0 flex-1 break-all text-sm select-all" data-test-id="public-document-url">
                {publicUrl}
              </span>
              <CopyToClipboard
                text={publicUrl}
                size={20}
                ariaLabel="Copy public link"
                testId="copy-public-document-url"
              />
            </div>
            <p className="text-sm text-content-dimmed">
              Disabling sharing stops this link from working. Enabling it again creates a new link.
            </p>
          </>
        ) : (
          <p className="text-sm text-content-dimmed">Public sharing is off. Enable it to create a link.</p>
        )}
        {error && (
          <ErrorCallout message="Could not update public sharing. Please try again." testId="public-sharing-error" />
        )}
        <div className="flex flex-wrap gap-2">
          {publicUrl ? (
            <SecondaryButton
              onClick={() => update(false)}
              loading={saving}
              disabled={saving}
              testId="disable-public-sharing"
            >
              Disable public sharing
            </SecondaryButton>
          ) : (
            <PrimaryButton
              onClick={() => update(true)}
              loading={saving}
              disabled={saving}
              testId="enable-public-sharing"
            >
              Enable public sharing
            </PrimaryButton>
          )}
          <SecondaryButton onClick={onClose} disabled={saving}>
            Done
          </SecondaryButton>
        </div>
      </div>
    </Modal>
  );
}
