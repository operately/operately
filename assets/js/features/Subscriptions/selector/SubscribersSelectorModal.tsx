import React from "react";

import Modal from "@/components/Modal";
import { SubscribersSelectorForm } from "./SubscribersSelectorForm";

interface SelectorModalProps {
  showSelector: boolean;
  setShowSelector: React.Dispatch<React.SetStateAction<boolean>>;
}

export function SubscribersSelectorModal({ showSelector, setShowSelector }: SelectorModalProps) {
  const closeForm = () => setShowSelector(false);

  return (
    <Modal
      title="Select people to notify"
      isOpen={showSelector}
      hideModal={() => setShowSelector(false)}
      minHeight="200px"
    >
      <SubscribersSelectorForm callback={closeForm} closeForm={closeForm} />
    </Modal>
  );
}
