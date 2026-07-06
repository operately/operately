import * as React from "react";

import * as Discussions from "@/models/discussions";
import Forms from "@/components/Forms";
import Modal from "@/components/Modal";
import { showSuccessToast } from "turboui";

interface Props {
  isOpen: boolean;
  toggleModal: () => void;
  discussionId: string;
  onSuccess: () => void;
}

export function DiscardDiscussionDraftModal({ isOpen, toggleModal, discussionId, onSuccess }: Props) {
  const [archive] = Discussions.useArchiveMessage();

  const form = Forms.useForm({
    fields: {},
    cancel: toggleModal,
    submit: async () => {
      await archive({ id: discussionId });
      showSuccessToast("Draft discarded", "The draft has been discarded.");
      onSuccess();
    },
  });

  return (
    <Modal isOpen={isOpen} hideModal={toggleModal}>
      <Forms.Form form={form}>
        <p>Are you sure you want to discard this draft?</p>
        <Forms.Submit saveText="Discard draft" cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}
