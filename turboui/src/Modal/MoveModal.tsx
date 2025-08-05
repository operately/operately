import React from "react";
import { PrimaryButton, SecondaryButton } from "../Button";

import Modal from "../Modal";
import { SpaceField } from "../SpaceField";

namespace MoveModal {
  export interface Space {
    id: string;
    name: string;
    link: string;
  }

  export interface Props {
    isMoveModalOpen: boolean;
    closeMoveModal: () => void;
    space: Space;
    setSpace: (space: Space) => void;
    spaceSearch: (params: { query: string }) => Promise<Space[]>;
  }
}

export function MoveModal(props: MoveModal.Props) {
  const [isMoving, setIsMoving] = React.useState(false);
  const [selectedSpace, setSelectedSpace] = React.useState<MoveModal.Space | null>(props.space);

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
            testId="space-field"
            space={selectedSpace}
            setSpace={setSelectedSpace}
            search={props.spaceSearch}
            variant="form-field"
          />
        </div>

        <div className="flex items-center gap-2">
          <PrimaryButton size="sm" type="submit" loading={isMoving} disabled={isMoving} testId="save">
            Move
          </PrimaryButton>
          <SecondaryButton size="sm" onClick={props.closeMoveModal} testId="cancel">
            Cancel
          </SecondaryButton>
        </div>
      </form>
    </Modal>
  );
}
