import React from "react";

import * as AdminApi from "@/ee/admin_api";
import Modal from "@/components/Modal";
import Forms from "@/components/Forms";
import { useLoadedData } from "./loader";

interface EnableFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EnableFeatureModal({ isOpen, onClose }: EnableFeatureModalProps) {
  const { company } = useLoadedData();
  const [enableFeature] = AdminApi.useEnableFeature();

  const form = Forms.useForm({
    fields: {
      feature: "",
    },
    cancel: onClose,
    submit: async () => {
      await enableFeature({
        companyId: company.id,
        feature: form.values.feature,
      });

      onClose();
      form.actions.reset();
    },
  });

  return (
    <Modal title="Enable Feature Flag" isOpen={isOpen} hideModal={onClose}>
      <Forms.Form form={form}>
        <div className="mb-4 text-sm text-content-accent">Enable an experimental feature for this company.</div>

        <Forms.FieldGroup>
          <Forms.TextInput field="feature" testId="feature-name" autoFocus placeholder="e.g. new_dashboard" />
        </Forms.FieldGroup>

        <Forms.Submit cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}
