import React from "react";

import Modal from "@/components/Modal";
import { SubscribersSelector, useSubscriptions } from "@/features/Subscriptions";
import { useCurrentSubscriptionsContext } from "./CurrentSubscriptionsContext";
import { getSelectedPeopleFromSubscriptions } from "../utils";

interface Props {
  isModalOpen: boolean;
  hideModal: () => void;
}

export function EditSubscriptionsModal({ isModalOpen, hideModal }: Props) {
  const { people, projectName, subscriptionList } = useCurrentSubscriptionsContext();
  const alreadySelected = getSelectedPeopleFromSubscriptions(people, subscriptionList.subscriptions!);
  const subscriptionsState = useSubscriptions(people, { alreadySelected });

  return (
    <Modal title="Edit subscribers" isOpen={isModalOpen} hideModal={hideModal}>
      <SubscribersSelector state={subscriptionsState} projectName={projectName} />
    </Modal>
  );
}
