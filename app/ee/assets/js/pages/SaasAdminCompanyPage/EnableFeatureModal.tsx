import React from "react";

import { Forms, Modal } from "turboui";
import { useEnableCompanyFeature } from "./featureFlagsLifecycle";

interface EnableFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
}

export function EnableFeatureModal({ isOpen, onClose, companyId }: EnableFeatureModalProps) {
  const enableFeature = useEnableCompanyFeature();

  const form = Forms.useForm({
    fields: {
      feature: "",
    },
    cancel: onClose,
    submit: async () => {
      const feature = form.values.feature.trim();
      if (feature === "") return;

      await enableFeature.mutateAsync({
        companyId,
        feature,
      });

      onClose();
      form.actions.reset();
    },
  });

  return (
    <Modal title="Add feature flag" isOpen={isOpen} onClose={onClose}>
      <Forms.Form form={form}>
        <div className="mb-4 text-sm text-content-accent">Turn on an experimental feature for this company.</div>

        <Forms.FieldGroup>
          <Forms.TextInput field="feature" testId="feature-name" autoFocus placeholder="e.g. new_dashboard" />
        </Forms.FieldGroup>

        <Forms.Submit cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}
