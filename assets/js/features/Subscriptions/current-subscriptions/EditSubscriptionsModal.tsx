import React from "react";

import Modal from "@/components/Modal";
import { SubscribersSelector, useSubscriptions } from "@/features/Subscriptions";
import { useCurrentSubscriptionsContext } from "./CurrentSubscriptionsContext";

interface Props {
  isModalOpen: boolean;
  hideModal: () => void;
}

export function EditSubscriptionsModal({ isModalOpen, hideModal }: Props) {
  const { people, projectName } = useCurrentSubscriptionsContext();
  const subscriptionsState = useSubscriptions(people);

  return (
    <Modal title="Edit subscribers" isOpen={isModalOpen} hideModal={hideModal}>
      <SubscribersSelector state={subscriptionsState} projectName={projectName} />
    </Modal>
  );
}
