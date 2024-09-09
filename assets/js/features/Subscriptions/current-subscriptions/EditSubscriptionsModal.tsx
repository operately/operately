import React from "react";

import Modal from "@/components/Modal";
import { useEditSubscriptionsList } from "@/models/notifications";
import { useSubscriptions, SubscribersSelectorForm } from "@/features/Subscriptions";
import { getSelectedPeopleFromSubscriptions } from "@/features/Subscriptions/utils";
import { useCurrentSubscriptionsContext } from "../CurrentSubscriptions";
import { SubscribersSelectorProvider } from "../SubscribersSelectorContext";

interface Props {
  isModalOpen: boolean;
  hideModal: () => void;
}

export function EditSubscriptionsModal({ isModalOpen, hideModal }: Props) {
  const { people, subscriptionList, callback, type } = useCurrentSubscriptionsContext();
  const [edit] = useEditSubscriptionsList();

  const alreadySelected = getSelectedPeopleFromSubscriptions(people, subscriptionList.subscriptions!);
  const subscriptionsState = useSubscriptions(people, { alreadySelected });

  const submitForm = (form) => {
    const selectedPeopleIds = form.fields.people.value!.map((p) => p.id);

    edit({
      id: subscriptionList.id,
      subscriberIds: selectedPeopleIds,
      type: type,
    }).then(() => {
      callback();
      hideModal();
    });
  };

  return (
    <SubscribersSelectorProvider state={subscriptionsState}>
      <Modal title="Edit subscribers" isOpen={isModalOpen} hideModal={hideModal} minHeight="200px">
        <SubscribersSelectorForm callback={submitForm} closeForm={hideModal} />
      </Modal>
    </SubscribersSelectorProvider>
  );
}
