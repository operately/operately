import React from "react";

import * as AdminApi from "@/ee/admin_api";
import { IconTrash, Modal, PrimaryButton, SecondaryButton, showErrorToast } from "turboui";

interface RemoveFeatureFlagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  enabledFeatures: string[];
  onSaved?: () => void;
}

export function removedFeatures(originalFeatures: string[], localFeatures: string[]): string[] {
  return originalFeatures.filter((feature) => !localFeatures.includes(feature));
}

export async function saveRemoveFeatureFlags({
  companyId,
  originalFeatures,
  localFeatures,
  disableFeatures,
  onClose,
  onSaved,
}: {
  companyId: string;
  originalFeatures: string[];
  localFeatures: string[];
  disableFeatures: (input: AdminApi.DisableFeaturesInput) => Promise<AdminApi.DisableFeaturesResult>;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const removed = removedFeatures(originalFeatures, localFeatures);

  if (removed.length === 0) {
    onClose();
    return;
  }

  await disableFeatures({ companyId, features: removed });
  onSaved?.();
  onClose();
}

export function RemoveFeatureFlagsModal({
  isOpen,
  onClose,
  companyId,
  enabledFeatures,
  onSaved,
}: RemoveFeatureFlagsModalProps) {
  const [disableFeatures] = AdminApi.useDisableFeatures();
  const [localFeatures, setLocalFeatures] = React.useState<string[]>(enabledFeatures);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setLocalFeatures(enabledFeatures);
      setSaving(false);
    }
  }, [isOpen, enabledFeatures]);

  const handleClose = () => {
    setLocalFeatures(enabledFeatures);
    setSaving(false);
    onClose();
  };

  const removeFeature = (feature: string) => {
    setLocalFeatures((features) => features.filter((f) => f !== feature));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      await saveRemoveFeatureFlags({
        companyId,
        originalFeatures: enabledFeatures,
        localFeatures,
        disableFeatures,
        onClose: handleClose,
        onSaved,
      });
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to remove feature flags. Please try again.";
      showErrorToast("Failed to remove feature flags", message);
    } finally {
      setSaving(false);
    }
  };

  const hasEnabledFeatures = enabledFeatures.length > 0;

  return (
    <Modal title="Remove Feature Flags" isOpen={isOpen} onClose={handleClose} size="small" closeOnBackdropClick={!saving}>
      <div className="mb-4 text-sm text-content-accent">
        Remove experimental feature flags from this company. Changes are saved when you click Save.
      </div>

      {!hasEnabledFeatures ? (
        <div className="py-6 text-sm text-content-dimmed text-center" data-test-id="no-feature-flags">
          No feature flags enabled
        </div>
      ) : (
        <div className="flex flex-col gap-2 mb-6" data-test-id="feature-flags-list">
          {localFeatures.map((feature) => (
            <div
              key={feature}
              className="flex items-center justify-between gap-3 border border-stroke-base rounded px-3 py-2"
              data-test-id={`feature-flag-row-${feature}`}
            >
              <code className="text-sm text-content-accent">{feature}</code>
              <button
                type="button"
                className="text-content-dimmed hover:text-content-error transition-colors"
                onClick={() => removeFeature(feature)}
                data-test-id={`remove-feature-${feature}`}
                aria-label={`Remove ${feature}`}
              >
                <IconTrash size={18} />
              </button>
            </div>
          ))}

          {localFeatures.length === 0 && (
            <div className="py-4 text-sm text-content-dimmed text-center">All flags marked for removal</div>
          )}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <SecondaryButton size="sm" onClick={handleClose} testId="cancel-remove-features">
          Cancel
        </SecondaryButton>
        <PrimaryButton
          size="sm"
          onClick={handleSave}
          loading={saving}
          disabled={!hasEnabledFeatures}
          testId="save-remove-features"
        >
          Save
        </PrimaryButton>
      </div>
    </Modal>
  );
}
