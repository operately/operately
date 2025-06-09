import React from "react";
import { GoalPage } from ".";
import { DangerButton } from "../Button";
import Modal from "../Modal";

export function DeleteModal(props: GoalPage.Props) {
  const [isOpen, setIsOpen] = React.useState(props.deleteModalOpen || false);

  const onClose = () => {
    setIsOpen(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Goal" size="small">
      <div className="p-4">
        <p className="mb-4">Are you sure you want to delete this goal? This action cannot be undone.</p>
        <DangerButton onClick={() => {}}>Delete Goal</DangerButton>
      </div>
    </Modal>
  );
}
