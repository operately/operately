import React from "react";

import Modal from "@/components/Modal";
import { useEditSubscriptionsList } from "@/models/notifications";
import { useSubscriptions, SubscribersSelectorForm } from "@/features/Subscriptions";
import { useCurrentSubscriptionsContext } from "../CurrentSubscriptions";
import { SubscribersSelectorProvider } from "../SubscribersSelectorContext";

interface Props {
  isModalOpen: boolean;
  hideModal: () => void;
}

export function EditSubscriptionsModal({ isModalOpen, hideModal }: Props) {
  const { subscriptionList, potentialSubscribers, callback, type } = useCurrentSubscriptionsContext();
  const [edit] = useEditSubscriptionsList();

  const subscriptionsState = useSubscriptions(potentialSubscribers);

  const submitForm = (form) => {
    const selectedIds = form.values.subscribers!.map((id) => id);

    edit({
      id: subscriptionList.id,
      subscriberIds: selectedIds,
      type: type,
    }).then(() => {
      callback();
      hideModal();
    });
  };

  return (
    <SubscribersSelectorProvider state={subscriptionsState}>
      <Modal title="Edit subscribers" isOpen={isModalOpen} hideModal={hideModal}>
        <SubscribersSelectorForm callback={submitForm} closeForm={hideModal} />
      </Modal>
    </SubscribersSelectorProvider>
  );
}
