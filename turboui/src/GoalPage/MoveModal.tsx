import React from "react";
import { GoalPage } from ".";
import { PrimaryButton, SecondaryButton } from "../Button";

import Modal from "../Modal";
import { SpaceField } from "../SpaceField";

export function MoveModal(props: GoalPage.State) {
  const [isMoving, setIsMoving] = React.useState(false);
  const [selectedSpace, setSelectedSpace] = React.useState<GoalPage.Space | null>(props.space);

  React.useEffect(() => setSelectedSpace(props.space), [props.space]);

  const handleSubmit = async (e: React.FormEvent) => {
    if (!selectedSpace) return;
    if (selectedSpace.id === props.space?.id) {
      props.closeMoveModal();
      return;
    }

    e.preventDefault();
    setIsMoving(true);

    try {
      props.setSpace(selectedSpace);
    } finally {
      setIsMoving(false);
      props.closeMoveModal();
    }
  };

  return (
    <Modal
      isOpen={props.isMoveModalOpen}
      onClose={props.closeMoveModal}
      size="small"
      title="Move goal to another space"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="font-bold text-sm mb-1.5 block">Select destination space</label>
          <SpaceField
            space={selectedSpace}
            setSpace={setSelectedSpace}
            search={props.spaceSearch}
            variant="form-field"
          />
        </div>

        <div className="flex items-center gap-2">
          <PrimaryButton size="sm" type="submit" loading={isMoving} disabled={isMoving}>
            Move
          </PrimaryButton>
          <SecondaryButton size="sm" onClick={props.closeMoveModal}>
            Cancel
          </SecondaryButton>
        </div>
      </form>
    </Modal>
  );
}
