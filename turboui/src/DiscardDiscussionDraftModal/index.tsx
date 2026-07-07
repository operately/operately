import * as React from "react";

import { Form, Submit, useForm } from "../Forms";
import { Modal } from "../Modal";
import { showSuccessToast } from "../Toasts";

export interface DiscardDiscussionDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscard: () => Promise<void>;
  onSuccess: () => void;
}

export function DiscardDiscussionDraftModal({ isOpen, onClose, onDiscard, onSuccess }: DiscardDiscussionDraftModalProps) {
  const form = useForm({
    fields: {},
    cancel: onClose,
    submit: async () => {
      await onDiscard();
      showSuccessToast("Draft discarded", "The draft has been discarded.");
      onSuccess();
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Form form={form}>
        <p>Are you sure you want to discard this draft?</p>
        <Submit saveText="Discard draft" cancelText="Cancel" />
      </Form>
    </Modal>
  );
}
